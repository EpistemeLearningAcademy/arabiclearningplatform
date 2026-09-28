import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import { test } from "node:test";
import { getEffectivePermissions, hasLinkedChildPermission, hasPermission, recordBreakGlassAccess } from "./authorization.js";

loadEnv({ path: resolve(process.cwd(), "../../.env") });
const enabled = process.env.RUN_DATABASE_TESTS === "1";

async function getLocalPrisma() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required for database integration tests.");
  const host = new URL(connectionString).hostname;
  if (host !== "localhost" && host !== "127.0.0.1") {
    throw new Error("Database integration tests are restricted to a local PostgreSQL host.");
  }
  return (await import("@greenfield/database")).prisma;
}

test("local database contains approved roles and separates school administration from finance", { skip: !enabled }, async () => {
  const prisma = await getLocalPrisma();
  try {
    assert.equal(await prisma.roleDefinition.count(), 14);
    assert.equal(await prisma.permission.count(), 45);
    assert.equal(await prisma.rolePermission.count(), 72);

    const schoolAdmin = await prisma.roleAssignment.findFirst({
      where: { roleKey: "SCHOOL_ADMIN" },
      select: { userId: true, scopeId: true },
    });
    assert.ok(schoolAdmin);
    const campus = await prisma.campus.findUniqueOrThrow({
      where: { id: schoolAdmin.scopeId! },
      select: { id: true, schoolId: true },
    });
    const scope = { type: "CAMPUS" as const, id: campus.id, campusId: campus.id, schoolId: campus.schoolId };
    assert.equal(await hasPermission(schoolAdmin.userId, "school.manage", scope), true);
    assert.equal(await hasPermission(schoolAdmin.userId, "finance.manage", scope), false);
    const effective = await getEffectivePermissions(schoolAdmin.userId, scope);
    assert.ok(effective.includes("school.manage"));
    assert.ok(!effective.includes("finance.manage"));
  } finally {
    await prisma.$disconnect();
  }
});

test("linked-parent access is limited to linked children", { skip: !enabled }, async () => {
  const prisma = await getLocalPrisma();
  let parentId: string | undefined;
  let firstStudentId: string | undefined;
  let secondStudentId: string | undefined;
  try {
    const parent = await prisma.user.create({
      data: { email: `authz-test-${randomUUID()}@invalid.local`, passwordHash: "test-only-invalid" },
      select: { id: true },
    });
    parentId = parent.id;
    const firstStudent = await prisma.studentProfile.create({ data: {}, select: { id: true } });
    firstStudentId = firstStudent.id;
    const secondStudent = await prisma.studentProfile.create({ data: {}, select: { id: true } });
    secondStudentId = secondStudent.id;
    await prisma.roleAssignment.create({
      data: { userId: parent.id, roleKey: "PARENT", scopeType: "SELF", scopeId: parent.id },
    });
    await prisma.parentStudent.create({
      data: { parentUserId: parent.id, studentId: firstStudent.id },
    });

    assert.equal(await hasLinkedChildPermission(parent.id, "finance.statement.linked.read", firstStudent.id), true);
    assert.equal(await hasLinkedChildPermission(parent.id, "finance.statement.linked.read", secondStudent.id), false);
    assert.equal(await hasLinkedChildPermission(parent.id, "finance.manage", firstStudent.id), false);
  } finally {
    if (parentId) await prisma.user.deleteMany({ where: { id: parentId } });
    if (firstStudentId) await prisma.studentProfile.deleteMany({ where: { id: firstStudentId } });
    if (secondStudentId) await prisma.studentProfile.deleteMany({ where: { id: secondStudentId } });
    await prisma.$disconnect();
  }
});

test("platform break-glass access is audited and requires the platform grant", { skip: !enabled }, async () => {
  const prisma = await getLocalPrisma();
  const createdUserIds: string[] = [];
  try {
    const platform = await prisma.user.create({
      data: { email: `authz-test-${randomUUID()}@invalid.local`, passwordHash: "test-only-invalid" },
      select: { id: true },
    });
    createdUserIds.push(platform.id);
    await assert.rejects(recordBreakGlassAccess({
      actorUserId: platform.id,
      resourceType: "integration-test",
      target: { type: "PLATFORM" },
      reason: "short",
    }));
    await prisma.roleAssignment.create({
      data: { userId: platform.id, roleKey: "PLATFORM_ADMIN", scopeType: "PLATFORM" },
    });
    const target = { type: "CAMPUS" as const, id: "test-campus", campusId: "test-campus" };
    assert.equal(await recordBreakGlassAccess({
      actorUserId: platform.id,
      resourceType: "integration-test",
      resourceId: "sensitive-record",
      target,
      reason: "Automated authorization integration test",
    }), true);
    assert.equal(await prisma.auditLog.count({
      where: { actorUserId: platform.id, action: "data.break_glass.granted", resourceType: "integration-test" },
    }), 1);

    const ordinary = await prisma.user.create({
      data: { email: `authz-test-${randomUUID()}@invalid.local`, passwordHash: "test-only-invalid" },
      select: { id: true },
    });
    createdUserIds.push(ordinary.id);
    assert.equal(await recordBreakGlassAccess({
      actorUserId: ordinary.id,
      resourceType: "integration-test",
      resourceId: "sensitive-record",
      target,
      reason: "Automated denied-access integration test",
    }), false);
    assert.equal(await prisma.auditLog.count({
      where: { actorUserId: ordinary.id, action: "data.break_glass.denied", resourceType: "integration-test" },
    }), 1);
  } finally {
    for (const actorUserId of createdUserIds) {
      await prisma.auditLog.deleteMany({ where: { actorUserId, resourceType: "integration-test" } });
      await prisma.user.deleteMany({ where: { id: actorUserId } });
    }
    await prisma.$disconnect();
  }
});

test("resource authorization resolves campus ancestry from the database and revocation is immediate", { skip: !enabled }, async () => {
  const prisma = await getLocalPrisma();
  const suffix = randomUUID();
  let userId: string | undefined;
  let schoolA: string | undefined;
  let schoolB: string | undefined;
  try {
    const firstSchool = await prisma.school.create({ data: { name: `Auth scope A ${suffix}`, slug: `auth-scope-a-${suffix}` }, select: { id: true } });
    schoolA = firstSchool.id;
    const secondSchool = await prisma.school.create({ data: { name: `Auth scope B ${suffix}`, slug: `auth-scope-b-${suffix}` }, select: { id: true } });
    schoolB = secondSchool.id;
    const firstCampus = await prisma.campus.create({ data: { schoolId: schoolA, name: "Campus A", slug: `campus-a-${suffix}` }, select: { id: true } });
    const secondCampus = await prisma.campus.create({ data: { schoolId: schoolB, name: "Campus B", slug: `campus-b-${suffix}` }, select: { id: true } });
    const user = await prisma.user.create({ data: { email: `scope-${suffix}@invalid.local`, passwordHash: "test-only-invalid" }, select: { id: true } });
    userId = user.id;
    const assignment = await prisma.roleAssignment.create({ data: { userId, roleKey: "SCHOOL_ADMIN", scopeType: "SCHOOL", scopeId: schoolA }, select: { id: true } });

    assert.equal(await hasPermission(userId, "school.manage", {
      type: "CAMPUS", id: firstCampus.id, campusId: secondCampus.id, schoolId: schoolB,
    }), true, "a forged ancestry payload must not change the target's actual School A scope");
    assert.equal(await hasPermission(userId, "school.manage", {
      type: "CAMPUS", id: secondCampus.id, campusId: firstCampus.id, schoolId: schoolA,
    }), false, "a forged School A ancestry must not authorize a real School B campus");

    await prisma.roleAssignment.update({ where: { id: assignment.id }, data: { revokedAt: new Date() } });
    assert.equal(await hasPermission(userId, "school.manage", { type: "CAMPUS", id: firstCampus.id }), false);
  } finally {
    if (userId) await prisma.user.deleteMany({ where: { id: userId } });
    if (schoolA) await prisma.school.deleteMany({ where: { id: schoolA } });
    if (schoolB) await prisma.school.deleteMany({ where: { id: schoolB } });
    await prisma.$disconnect();
  }
});

test("database rejects cross-school classes and teacher assignments reference users", { skip: !enabled }, async () => {
  const prisma = await getLocalPrisma();
  const suffix = randomUUID();
  let schoolA: string | undefined;
  let schoolB: string | undefined;
  let teacherId: string | undefined;
  try {
    const a = await prisma.school.create({ data: { name: `Academic A ${suffix}`, slug: `academic-a-${suffix}` }, select: { id: true } }); schoolA = a.id;
    const b = await prisma.school.create({ data: { name: `Academic B ${suffix}`, slug: `academic-b-${suffix}` }, select: { id: true } }); schoolB = b.id;
    const campus = await prisma.campus.create({ data: { schoolId: schoolB, name: "Campus B", slug: `academic-b-campus-${suffix}` }, select: { id: true } });
    const section = await prisma.academicSection.create({ data: { schoolId: schoolA, name: `Section ${suffix}` }, select: { id: true } });
    const level = await prisma.academicLevel.create({ data: { sectionId: section.id, name: `Level ${suffix}` }, select: { id: true } });
    await assert.rejects(prisma.classGroup.create({ data: { campusId: campus.id, levelId: level.id, name: `Invalid class ${suffix}` } }));

    const subject = await prisma.subject.create({ data: { schoolId: schoolB, name: `Subject ${suffix}` }, select: { id: true } });
    const group = await prisma.classGroup.create({ data: { campusId: campus.id, levelId: (await prisma.academicLevel.create({ data: { sectionId: (await prisma.academicSection.create({ data: { schoolId: schoolB, name: `Section B ${suffix}` }, select: { id: true } })).id, name: `Level B ${suffix}` }, select: { id: true } })).id, name: `Valid class ${suffix}` }, select: { id: true } });
    const teacher = await prisma.user.create({ data: { email: `teacher-${suffix}@invalid.local`, passwordHash: "test-only-invalid" }, select: { id: true } }); teacherId = teacher.id;
    const assignment = await prisma.subjectAssignment.create({ data: { classGroupId: group.id, subjectId: subject.id, teacherUserId: teacher.id }, select: { teacherUserId: true } });
    assert.equal(assignment.teacherUserId, teacher.id);
  } finally {
    if (teacherId) await prisma.user.deleteMany({ where: { id: teacherId } });
    if (schoolA) await prisma.school.deleteMany({ where: { id: schoolA } });
    if (schoolB) await prisma.school.deleteMany({ where: { id: schoolB } });
    await prisma.$disconnect();
  }
});

