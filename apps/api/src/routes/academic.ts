import express from "express";
import { hashSessionToken } from "../auth.js";
import { hasActiveRoleForResource, hasPermission, hasResourcePermission, resolveResourceScope, type ResourceType } from "../authorization.js";

const router = express.Router();
const { prisma } = await import("@greenfield/database");
const db = prisma as any;
const fail = (res: express.Response, status: number, code: string, message: string) =>
  res.status(status).json({ error: { code, message } });

async function userId(req: express.Request): Promise<string | null> {
  const match = req.header("authorization")?.match(/^Bearer\s+([A-Za-z0-9_-]+)$/i);
  if (!match) return null;
  const session = await prisma.session.findFirst({ where: { tokenHash: hashSessionToken(match[1]), expiresAt: { gt: new Date() } }, select: { userId: true } });
  return session?.userId ?? null;
}
function boundedLimit(value: unknown): number | null {
  if (value === undefined) return 50;
  if (typeof value !== "string" || !/^\d{1,3}$/.test(value)) return null;
  const n = Number(value);
  return n >= 1 && n <= 100 ? n : null;
}
function validName(body: any): boolean {
  return body && typeof body === "object" && typeof body.name === "string" && body.name.trim().length > 0 && body.name.trim().length <= 120 &&
    (body.code === undefined || body.code === null || (typeof body.code === "string" && body.code.trim().length <= 40));
}
function dates(body: any): { startsAt?: Date | null; endsAt?: Date | null } | null {
  const parse = (v: unknown): Date | null | undefined => {
    if (v === undefined) return undefined;
    if (v === null) return null;
    if (typeof v !== "string" || !Number.isFinite(Date.parse(v))) return undefined;
    return new Date(v);
  };
  const startsAt = parse(body.startsAt), endsAt = parse(body.endsAt);
  if ((body.startsAt !== undefined && startsAt === undefined) || (body.endsAt !== undefined && endsAt === undefined)) return null;
  if (startsAt && endsAt && endsAt < startsAt) return null;
  return { ...(startsAt !== undefined ? { startsAt } : {}), ...(endsAt !== undefined ? { endsAt } : {}) };
}
async function requireScope(user: string, type: ResourceType, id: string, permission = "academic.structure.read") {
  const target = await resolveResourceScope(type, id);
  if (!target) return { status: 404 as const, target: null };
  if (!(await hasPermission(user, permission, target))) return { status: 403 as const, target: null };
  return { status: 200 as const, target };
}
async function hasAny(user: string, permissions: string[], type: ResourceType, id: string) {
  for (const permission of permissions) if (await hasResourcePermission(user, permission, type, id)) return true;
  return false;
}
async function createHandler(req: express.Request, res: express.Response, key: string, permission = "academic.structure.manage") {
  const actor = await userId(req);
  if (!actor) return fail(res, 401, "UNAUTHENTICATED", "A valid bearer token is required.");
  const result = await requireScope(actor, "SCHOOL", String(req.body?.schoolId ?? ""), permission);
  if (result.status !== 200) return fail(res, result.status, result.status === 404 ? "NOT_FOUND" : "FORBIDDEN", result.status === 404 ? "School not found." : "You cannot manage academic structure at this school.");
  const body = req.body;
  if (typeof body?.schoolId !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(body.schoolId)) return fail(res, 422, "VALIDATION_ERROR", "A valid schoolId is required.");
  if (!validName(body)) return fail(res, 422, "VALIDATION_ERROR", "A name of 1 to 120 characters and an optional code of at most 40 characters are required.");
  const when = dates(body);
  if (!when) return fail(res, 422, "VALIDATION_ERROR", "Dates must be valid ISO timestamps and end after start.");
  let data: any = { name: body.name.trim(), ...(body.code !== undefined ? { code: body.code?.trim() || null } : {}) };
  let created: any;
  if (key === "academicYear") {
    data = { ...data, schoolId: body.schoolId, ...when };
    created = await db.academicYear.create({ data, select: { id: true, schoolId: true, name: true, startsAt: true, endsAt: true } });
  } else if (key === "academicSection") {
    data = { ...data, schoolId: body.schoolId };
    created = await db.academicSection.create({ data, select: { id: true, schoolId: true, name: true, code: true } });
  } else if (key === "subject") {
    data = { ...data, schoolId: body.schoolId };
    created = await db.subject.create({ data, select: { id: true, schoolId: true, name: true, code: true } });
  }
  if (!created) return fail(res, 404, "NOT_FOUND", "Unknown academic resource.");
  await prisma.auditLog.create({ data: { actorUserId: actor, action: `academic.${key}.created`, resourceType: key, resourceId: created.id, scopeType: "SCHOOL", scopeId: body.schoolId, metadata: {} } });
  return res.status(201).json({ data: created });
}

router.get("/academic/years", async (req, res) => {
  const actor = await userId(req); if (!actor) return fail(res, 401, "UNAUTHENTICATED", "A valid bearer token is required.");
  const schoolId = typeof req.query.schoolId === "string" ? req.query.schoolId : "";
  const scope = await requireScope(actor, "SCHOOL", schoolId);
  if (scope.status !== 200) return fail(res, scope.status, scope.status === 404 ? "NOT_FOUND" : "FORBIDDEN", "School scope is unavailable.");
  const limit = boundedLimit(req.query.limit); if (!limit) return fail(res, 422, "VALIDATION_ERROR", "limit must be between 1 and 100.");
  const after = typeof req.query.after === "string" ? req.query.after : undefined;
  const rows = await prisma.academicYear.findMany({ where: { schoolId, ...(after ? { id: { gt: after } } : {}) }, orderBy: { id: "asc" }, take: limit + 1, select: { id: true, name: true, startsAt: true, endsAt: true, terms: { orderBy: { sequence: "asc" }, select: { id: true, name: true, startsAt: true, endsAt: true, sequence: true } } } });
  return res.json({ data: rows.slice(0, limit), page: { limit, nextCursor: rows.length > limit ? rows[limit - 1].id : null } });
});
router.post("/academic/years", (req, res) => createHandler(req, res, "academicYear"));

router.get("/academic/years/:yearId/terms", async (req, res) => {
  const actor = await userId(req); if (!actor) return fail(res, 401, "UNAUTHENTICATED", "A valid bearer token is required.");
  const scope = await requireScope(actor, "ACADEMIC_YEAR", req.params.yearId);
  if (scope.status !== 200) return fail(res, scope.status, scope.status === 404 ? "NOT_FOUND" : "FORBIDDEN", "Academic year is unavailable.");
  const year = await prisma.academicYear.findUnique({ where: { id: req.params.yearId }, select: { schoolId: true } });
  const limit = boundedLimit(req.query.limit); if (!limit) return fail(res, 422, "VALIDATION_ERROR", "limit must be between 1 and 100.");
  const rows = await prisma.term.findMany({ where: { academicYearId: req.params.yearId }, orderBy: { sequence: "asc" }, take: limit, select: { id: true, name: true, startsAt: true, endsAt: true, sequence: true } });
  return res.json({ data: rows, schoolId: year?.schoolId });
});
router.post("/academic/terms", async (req, res) => {
  const actor = await userId(req); if (!actor) return fail(res, 401, "UNAUTHENTICATED", "A valid bearer token is required.");
  const { academicYearId, sequence } = req.body ?? {};
  if (typeof academicYearId !== "string" || (sequence !== undefined && (!Number.isInteger(sequence) || sequence < 1 || sequence > 20)) || !validName(req.body)) return fail(res, 422, "VALIDATION_ERROR", "academicYearId, a valid name, and an optional sequence from 1 to 20 are required.");
  const scope = await requireScope(actor, "ACADEMIC_YEAR", academicYearId, "academic.structure.manage");
  if (scope.status !== 200) return fail(res, scope.status, scope.status === 404 ? "NOT_FOUND" : "FORBIDDEN", "You cannot manage terms for this academic year.");
  const period = dates(req.body); if (!period) return fail(res, 422, "VALIDATION_ERROR", "Term dates are invalid.");
  const created = await prisma.term.create({ data: { academicYearId, name: req.body.name.trim(), sequence: sequence ?? null, ...period }, select: { id: true, academicYearId: true, name: true, sequence: true, startsAt: true, endsAt: true } });
  await prisma.auditLog.create({ data: { actorUserId: actor, action: "academic.term.created", resourceType: "Term", resourceId: created.id, scopeType: "SCHOOL", scopeId: scope.target?.schoolId, metadata: { academicYearId } } });
  return res.status(201).json({ data: created });
});

router.get("/academic/sections", async (req, res) => {
  const actor = await userId(req); if (!actor) return fail(res, 401, "UNAUTHENTICATED", "A valid bearer token is required.");
  const schoolId = typeof req.query.schoolId === "string" ? req.query.schoolId : "";
  const scope = await requireScope(actor, "SCHOOL", schoolId);
  if (scope.status !== 200) return fail(res, scope.status, scope.status === 404 ? "NOT_FOUND" : "FORBIDDEN", "School scope is unavailable.");
  const limit = boundedLimit(req.query.limit); if (!limit) return fail(res, 422, "VALIDATION_ERROR", "limit must be between 1 and 100.");
  const rows = await prisma.academicSection.findMany({ where: { schoolId }, orderBy: { name: "asc" }, take: limit, select: { id: true, name: true, code: true, levels: { orderBy: { name: "asc" }, select: { id: true, name: true, code: true } } } });
  return res.json({ data: rows });
});
router.post("/academic/sections", (req, res) => createHandler(req, res, "academicSection"));

router.get("/academic/levels", async (req, res) => {
  const actor = await userId(req); if (!actor) return fail(res, 401, "UNAUTHENTICATED", "A valid bearer token is required.");
  const sectionId = typeof req.query.sectionId === "string" ? req.query.sectionId : "";
  const scope = await requireScope(actor, "ACADEMIC_SECTION", sectionId);
  if (scope.status !== 200) return fail(res, scope.status, scope.status === 404 ? "NOT_FOUND" : "FORBIDDEN", "Section is unavailable.");
  const limit = boundedLimit(req.query.limit); if (!limit) return fail(res, 422, "VALIDATION_ERROR", "limit must be between 1 and 100.");
  const rows = await prisma.academicLevel.findMany({ where: { sectionId }, orderBy: { name: "asc" }, take: limit, select: { id: true, name: true, code: true, sectionId: true, classes: { orderBy: { name: "asc" }, select: { id: true, name: true, code: true, campusId: true } } } });
  return res.json({ data: rows });
});
router.post("/academic/levels", async (req, res) => {
  const actor = await userId(req); if (!actor) return fail(res, 401, "UNAUTHENTICATED", "A valid bearer token is required.");
  const { sectionId } = req.body ?? {};
  if (typeof sectionId !== "string" || !validName(req.body)) return fail(res, 422, "VALIDATION_ERROR", "sectionId and a valid name are required.");
  const scope = await requireScope(actor, "ACADEMIC_SECTION", sectionId, "academic.structure.manage");
  if (scope.status !== 200) return fail(res, scope.status, scope.status === 404 ? "NOT_FOUND" : "FORBIDDEN", "You cannot manage levels in this section.");
  const created = await prisma.academicLevel.create({ data: { sectionId, name: req.body.name.trim(), code: req.body.code?.trim() || null }, select: { id: true, sectionId: true, name: true, code: true } });
  await prisma.auditLog.create({ data: { actorUserId: actor, action: "academic.level.created", resourceType: "AcademicLevel", resourceId: created.id, scopeType: "SECTION", scopeId: sectionId, metadata: {} } });
  return res.status(201).json({ data: created });
});

router.get("/academic/classes", async (req, res) => {
  const actor = await userId(req); if (!actor) return fail(res, 401, "UNAUTHENTICATED", "A valid bearer token is required.");
  const campusId = typeof req.query.campusId === "string" ? req.query.campusId : "";
  const sectionId = typeof req.query.sectionId === "string" ? req.query.sectionId : "";
  if (Boolean(campusId) === Boolean(sectionId)) return fail(res, 422, "VALIDATION_ERROR", "Provide exactly one of campusId or sectionId.");
  const scopeType = campusId ? "CAMPUS" : "ACADEMIC_SECTION";
  const scopeId = campusId || sectionId;
  const scope = await requireScope(actor, scopeType, scopeId);
  if (scope.status !== 200) return fail(res, scope.status, scope.status === 404 ? "NOT_FOUND" : "FORBIDDEN", "Academic class scope is unavailable.");
  const limit = boundedLimit(req.query.limit); if (!limit) return fail(res, 422, "VALIDATION_ERROR", "limit must be between 1 and 100.");
  const rows = await prisma.classGroup.findMany({ where: campusId ? { campusId } : { level: { sectionId } }, orderBy: { name: "asc" }, take: limit, select: { id: true, name: true, code: true, campus: { select: { id: true, name: true } }, level: { select: { id: true, name: true, section: { select: { id: true, name: true } } } }, subjectAssignments: { where: { AND: [{ OR: [{ startsAt: null }, { startsAt: { lte: new Date() } }] }, { OR: [{ endsAt: null }, { endsAt: { gte: new Date() } }] }] }, select: { id: true, subject: { select: { id: true, name: true, code: true } }, teacher: { select: { id: true, name: true } } } } } });
  return res.json({ data: rows });
});
router.post("/academic/classes", async (req, res) => {
  const actor = await userId(req); if (!actor) return fail(res, 401, "UNAUTHENTICATED", "A valid bearer token is required.");
  const { campusId, levelId } = req.body ?? {};
  if (typeof campusId !== "string" || typeof levelId !== "string" || !validName(req.body)) return fail(res, 422, "VALIDATION_ERROR", "campusId, levelId and a valid name are required.");
  const [campus, level] = await Promise.all([
    prisma.campus.findUnique({ where: { id: campusId }, select: { schoolId: true } }),
    prisma.academicLevel.findUnique({ where: { id: levelId }, select: { section: { select: { id: true, schoolId: true } } } }),
  ]);
  if (!campus || !level) return fail(res, 404, "NOT_FOUND", "Campus or academic level not found.");
  if (campus.schoolId !== level.section.schoolId) return fail(res, 422, "INVALID_RELATIONSHIP", "Campus and academic level must belong to the same school.");
  const mayManage = await hasPermission(actor, "academic.structure.manage", { type: "CAMPUS", id: campusId }) ||
    await hasPermission(actor, "academic.structure.manage", { type: "SECTION", id: level.section.id });
  if (!mayManage) return fail(res, 403, "FORBIDDEN", "You cannot manage classes for this campus or academic section.");
  const created = await prisma.classGroup.create({ data: { campusId, levelId, name: req.body.name.trim(), code: req.body.code?.trim() || null }, select: { id: true, campusId: true, levelId: true, name: true, code: true } });
  await prisma.auditLog.create({ data: { actorUserId: actor, action: "academic.class.created", resourceType: "ClassGroup", resourceId: created.id, scopeType: "CAMPUS", scopeId: campusId, metadata: { levelId } } });
  return res.status(201).json({ data: created });
});

router.get("/academic/subjects", async (req, res) => {
  const actor = await userId(req); if (!actor) return fail(res, 401, "UNAUTHENTICATED", "A valid bearer token is required.");
  const schoolId = typeof req.query.schoolId === "string" ? req.query.schoolId : "";
  const scope = await requireScope(actor, "SCHOOL", schoolId);
  if (scope.status !== 200) return fail(res, scope.status, scope.status === 404 ? "NOT_FOUND" : "FORBIDDEN", "School scope is unavailable.");
  const limit = boundedLimit(req.query.limit); if (!limit) return fail(res, 422, "VALIDATION_ERROR", "limit must be between 1 and 100.");
  const rows = await prisma.subject.findMany({ where: { schoolId }, orderBy: { name: "asc" }, take: limit, select: { id: true, name: true, code: true, assignments: { select: { id: true, classGroup: { select: { id: true, name: true, campusId: true } }, teacher: { select: { id: true, name: true } }, startsAt: true, endsAt: true } } } });
  return res.json({ data: rows });
});
router.post("/academic/subjects", (req, res) => createHandler(req, res, "subject"));

router.get("/academic/teacher-assignments", async (req, res) => {
  const actor = await userId(req); if (!actor) return fail(res, 401, "UNAUTHENTICATED", "A valid bearer token is required.");
  const classGroupId = typeof req.query.classGroupId === "string" ? req.query.classGroupId : "";
  if (!(await resolveResourceScope("CLASS_GROUP", classGroupId))) return fail(res, 404, "NOT_FOUND", "Class group is unavailable.");
  if (!(await hasAny(actor, ["academic.structure.read", "students.class.read"], "CLASS_GROUP", classGroupId))) return fail(res, 403, "FORBIDDEN", "You cannot read teacher assignments for this class.");
  const limit = boundedLimit(req.query.limit); if (!limit) return fail(res, 422, "VALIDATION_ERROR", "limit must be between 1 and 100.");
  const rows = await prisma.subjectAssignment.findMany({ where: { classGroupId }, take: limit, orderBy: { id: "asc" }, select: { id: true, classGroupId: true, subject: { select: { id: true, name: true, code: true } }, teacher: { select: { id: true, name: true } }, startsAt: true, endsAt: true } });
  return res.json({ data: rows });
});

router.post("/academic/teacher-assignments", async (req, res) => {
  const actor = await userId(req); if (!actor) return fail(res, 401, "UNAUTHENTICATED", "A valid bearer token is required.");
  const { classGroupId, subjectId, teacherUserId } = req.body ?? {};
  if (typeof classGroupId !== "string" || typeof subjectId !== "string" || typeof teacherUserId !== "string") return fail(res, 422, "VALIDATION_ERROR", "classGroupId, subjectId and teacherUserId are required.");
  const scope = await requireScope(actor, "CLASS_GROUP", classGroupId, "academic.assignments.manage");
  if (scope.status !== 200) return fail(res, scope.status, scope.status === 404 ? "NOT_FOUND" : "FORBIDDEN", "You cannot manage assignments for this class.");
  const classGroup = await prisma.classGroup.findUnique({ where: { id: classGroupId }, select: { campus: { select: { schoolId: true } } } });
  const subject = await prisma.subject.findUnique({ where: { id: subjectId }, select: { schoolId: true } });
  if (!classGroup || !subject || classGroup.campus.schoolId !== subject.schoolId) return fail(res, 422, "INVALID_RELATIONSHIP", "The subject and class must belong to the same school.");
  if (!(await hasActiveRoleForResource(teacherUserId, "TEACHER", "CLASS_GROUP", classGroupId))) return fail(res, 422, "INVALID_TEACHER", "The selected user must hold an active Teacher role whose scope covers this class.");
  const period = dates(req.body); if (!period) return fail(res, 422, "VALIDATION_ERROR", "Assignment dates are invalid.");
  const created = await prisma.subjectAssignment.create({ data: { classGroupId, subjectId, teacherUserId, ...period }, select: { id: true, classGroupId: true, subjectId: true, teacherUserId: true, startsAt: true, endsAt: true } });
  await prisma.auditLog.create({ data: { actorUserId: actor, action: "academic.teacher_assignment.created", resourceType: "SubjectAssignment", resourceId: created.id, scopeType: "CLASS_GROUP", scopeId: classGroupId, metadata: { subjectId, teacherUserId } } });
  return res.status(201).json({ data: created });
});

router.get("/academic/enrollments", async (req, res) => {
  const actor = await userId(req); if (!actor) return fail(res, 401, "UNAUTHENTICATED", "A valid bearer token is required.");
  const classGroupId = typeof req.query.classGroupId === "string" ? req.query.classGroupId : "";
  if (!(await resolveResourceScope("CLASS_GROUP", classGroupId))) return fail(res, 404, "NOT_FOUND", "Class group is unavailable.");
  if (!(await hasAny(actor, ["students.academic.read", "students.school.read", "students.campus.read", "students.class.read"], "CLASS_GROUP", classGroupId))) return fail(res, 403, "FORBIDDEN", "You cannot read student enrollment data for this class.");
  const limit = boundedLimit(req.query.limit); if (!limit) return fail(res, 422, "VALIDATION_ERROR", "limit must be between 1 and 100.");
  const rows = await prisma.studentEnrollment.findMany({ where: { classGroupId }, take: limit, orderBy: { startsAt: "desc" }, select: { id: true, startsAt: true, endsAt: true, academicYear: { select: { id: true, name: true } }, student: { select: { id: true, user: { select: { name: true } } } } } });
  return res.json({ data: rows });
});

router.post("/academic/enrollments", async (req, res) => {
  const actor = await userId(req); if (!actor) return fail(res, 401, "UNAUTHENTICATED", "A valid bearer token is required.");
  const { studentId, classGroupId, academicYearId } = req.body ?? {};
  if (![studentId, classGroupId, academicYearId].every((v) => typeof v === "string" && v.length > 0)) return fail(res, 422, "VALIDATION_ERROR", "studentId, classGroupId and academicYearId are required.");
  const scope = await requireScope(actor, "CLASS_GROUP", classGroupId, "academic.structure.manage");
  if (scope.status !== 200) return fail(res, scope.status, scope.status === 404 ? "NOT_FOUND" : "FORBIDDEN", "You cannot manage enrollments for this class.");
  const [group, year, student] = await Promise.all([
    prisma.classGroup.findUnique({ where: { id: classGroupId }, select: { campus: { select: { schoolId: true } } } }),
    prisma.academicYear.findUnique({ where: { id: academicYearId }, select: { schoolId: true } }),
    prisma.studentProfile.findUnique({ where: { id: studentId }, select: { id: true } }),
  ]);
  if (!group || !year || !student) return fail(res, 404, "NOT_FOUND", "Student, class or academic year not found.");
  if (group.campus.schoolId !== year.schoolId) return fail(res, 422, "INVALID_RELATIONSHIP", "Class and academic year must belong to the same school.");
  const period = dates(req.body); if (!period || !period.startsAt) return fail(res, 422, "VALIDATION_ERROR", "A valid enrollment start date is required; end date must be after start.");
  const start = period.startsAt ?? new Date(0), end = period.endsAt ?? new Date("9999-12-31T23:59:59.999Z");
  const overlap = await prisma.studentEnrollment.findFirst({ where: { studentId, academicYearId, OR: [{ startsAt: null }, { startsAt: { lte: end } }], AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: start } }] }] }, select: { id: true } });
  if (overlap) return fail(res, 409, "ENROLLMENT_OVERLAP", "This student already has an overlapping enrollment in the academic year.");
  const created = await prisma.studentEnrollment.create({ data: { studentId, classGroupId, academicYearId, ...period }, select: { id: true, studentId: true, classGroupId: true, academicYearId: true, startsAt: true, endsAt: true } });
  await prisma.auditLog.create({ data: { actorUserId: actor, action: "academic.enrollment.created", resourceType: "StudentEnrollment", resourceId: created.id, scopeType: "CLASS_GROUP", scopeId: classGroupId, metadata: { academicYearId } } });
  return res.status(201).json({ data: created });
});

export default router;
