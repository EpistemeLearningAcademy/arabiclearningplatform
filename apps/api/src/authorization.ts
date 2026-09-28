export type PermissionScope = {
  type: "PLATFORM" | "SCHOOL" | "CAMPUS" | "SECTION" | "CLASS_GROUP" | "TRANSPORT_RUN" | "SELF";
  id?: string;
  schoolId?: string;
  campusId?: string;
  sectionId?: string;
  classGroupId?: string;
};
export type ResourceType = PermissionScope["type"] | "ACADEMIC_YEAR" | "TERM" | "ACADEMIC_SECTION" | "ACADEMIC_LEVEL" | "SUBJECT" | "SUBJECT_ASSIGNMENT" | "STUDENT_PROFILE" | "STUDENT_ENROLLMENT";

export function scopeMatches(
  assignment: { scopeType: string; scopeId: string | null },
  target: PermissionScope,
  userId: string,
): boolean {
  if (assignment.scopeType === "PLATFORM" && assignment.scopeId === null) return true;
  const expectedId = target.type === "SELF" ? userId : target.id;
  if (assignment.scopeType === target.type && assignment.scopeId === expectedId) return true;
  if (assignment.scopeType === "SCHOOL" && Boolean(target.schoolId) && assignment.scopeId === target.schoolId) return true;
  if (assignment.scopeType === "CAMPUS" && Boolean(target.campusId) && assignment.scopeId === target.campusId) return true;
  if (assignment.scopeType === "SECTION" && Boolean(target.sectionId) && assignment.scopeId === target.sectionId) return true;
  return false;
}

export async function hasPermission(
  userId: string,
  permissionCode: string,
  requestedTarget: PermissionScope,
): Promise<boolean> {
  const { prisma } = await import("@greenfield/database");
  const target = await trustedTarget(userId, requestedTarget);
  if (!target) return false;
  const assignments = await prisma.roleAssignment.findMany({
    where: { userId, revokedAt: null, role: { permissions: { some: { permissionCode } } } },
    select: { scopeType: true, scopeId: true },
  });
  return assignments.some((assignment) => scopeMatches(assignment, target, userId));
}

export async function getEffectivePermissions(
  userId: string,
  target: PermissionScope,
): Promise<string[]> {
  const { prisma } = await import("@greenfield/database");
  const resolvedTarget = await trustedTarget(userId, target);
  if (!resolvedTarget) return [];
  const assignments = await prisma.roleAssignment.findMany({
    where: { userId, revokedAt: null, role: { permissions: { some: {} } } },
    select: {
      scopeType: true,
      scopeId: true,
      role: { select: { permissions: { select: { permissionCode: true } } } },
    },
  });
  const codes = new Set<string>();
  for (const assignment of assignments) {
    if (!scopeMatches(assignment, resolvedTarget, userId)) continue;
    for (const grant of assignment.role.permissions) codes.add(grant.permissionCode);
  }
  return [...codes].sort();
}

async function trustedTarget(userId: string, requested: PermissionScope): Promise<PermissionScope | null> {
  if (requested.type === "PLATFORM") return { type: "PLATFORM" };
  if (requested.type === "SELF") return requested.id === userId ? { type: "SELF", id: userId } : null;
  if (!requested.id) return null;
  return resolveResourceScope(requested.type, requested.id);
}

/** Resolve scope ancestry from persisted relationships; callers pass only a resource type and ID. */
export async function resolveResourceScope(
  type: ResourceType,
  id: string,
): Promise<PermissionScope | null> {
  if (typeof id !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(id)) return null;
  const { prisma } = await import("@greenfield/database");
  if (type === "PLATFORM") return { type, id };
  if (type === "SELF") return { type, id };
  if (type === "SCHOOL") {
    const school = await prisma.school.findUnique({ where: { id }, select: { id: true } });
    return school ? { type, id, schoolId: school.id } : null;
  }
  if (type === "CAMPUS") {
    const campus = await prisma.campus.findUnique({ where: { id }, select: { id: true, schoolId: true } });
    return campus ? { type, id, campusId: campus.id, schoolId: campus.schoolId } : null;
  }
  if (type === "SECTION") {
    const section = await prisma.academicSection.findUnique({ where: { id }, select: { id: true, schoolId: true } });
    return section ? { type, id, sectionId: section.id, schoolId: section.schoolId } : null;
  }
  if (type === "CLASS_GROUP") {
    const group = await prisma.classGroup.findUnique({ where: { id }, select: {
      id: true,
      campus: { select: { id: true, schoolId: true } },
      level: { select: { section: { select: { id: true, schoolId: true } } } },
    } });
    if (!group || group.campus.schoolId !== group.level.section.schoolId) return null;
    return { type, id: group.id, classGroupId: group.id, campusId: group.campus.id, schoolId: group.campus.schoolId, sectionId: group.level.section.id };
  }
  if (type === "ACADEMIC_YEAR") {
    const row = await prisma.academicYear.findUnique({ where: { id }, select: { id: true, schoolId: true } });
    return row ? { type: "SCHOOL", id: row.schoolId, schoolId: row.schoolId } : null;
  }
  if (type === "TERM") {
    const row = await prisma.term.findUnique({ where: { id }, select: { academicYear: { select: { schoolId: true } } } });
    return row ? { type: "SCHOOL", id: row.academicYear.schoolId, schoolId: row.academicYear.schoolId } : null;
  }
  if (type === "ACADEMIC_SECTION") {
    const row = await prisma.academicSection.findUnique({ where: { id }, select: { id: true, schoolId: true } });
    return row ? { type: "SECTION", id: row.id, schoolId: row.schoolId, sectionId: row.id } : null;
  }
  if (type === "ACADEMIC_LEVEL") {
    const row = await prisma.academicLevel.findUnique({ where: { id }, select: { section: { select: { id: true, schoolId: true } } } });
    return row ? { type: "SECTION", id: row.section.id, sectionId: row.section.id, schoolId: row.section.schoolId } : null;
  }
  if (type === "SUBJECT") {
    const row = await prisma.subject.findUnique({ where: { id }, select: { schoolId: true } });
    return row ? { type: "SCHOOL", id: row.schoolId, schoolId: row.schoolId } : null;
  }
  if (type === "SUBJECT_ASSIGNMENT") {
    const row = await prisma.subjectAssignment.findUnique({ where: { id }, select: { classGroupId: true } });
    return row ? resolveResourceScope("CLASS_GROUP", row.classGroupId) : null;
  }
  if (type === "STUDENT_PROFILE") {
    const row = await prisma.studentProfile.findUnique({ where: { id }, select: { id: true, userId: true } });
    return row ? { type: "SELF", id: row.userId ?? "" } : null;
  }
  if (type === "STUDENT_ENROLLMENT") {
    const row = await prisma.studentEnrollment.findUnique({ where: { id }, select: { classGroupId: true } });
    return row ? resolveResourceScope("CLASS_GROUP", row.classGroupId) : null;
  }
  if (type === "TRANSPORT_RUN") return null;
  return null;
}

export async function hasResourcePermission(
  userId: string,
  permissionCode: string,
  resourceType: ResourceType,
  resourceId: string,
): Promise<boolean> {
  const target = await resolveResourceScope(resourceType, resourceId);
  return target ? hasPermission(userId, permissionCode, target) : false;
}

export async function hasActiveRoleForResource(
  userId: string,
  roleKey: string,
  resourceType: ResourceType,
  resourceId: string,
): Promise<boolean> {
  const target = await resolveResourceScope(resourceType, resourceId);
  if (!target) return false;
  const { prisma } = await import("@greenfield/database");
  const assignments = await prisma.roleAssignment.findMany({
    where: { userId, roleKey, revokedAt: null },
    select: { scopeType: true, scopeId: true },
  });
  return assignments.some((assignment) => scopeMatches(assignment, target, userId));
}

export async function canAccessStudentProfile(
  userId: string,
  studentProfileId: string,
  permissionCode = "students.linked.read",
): Promise<boolean> {
  const { prisma } = await import("@greenfield/database");
  const student = await prisma.studentProfile.findUnique({
    where: { id: studentProfileId },
    select: { id: true, userId: true, parents: { where: { parentUserId: userId }, select: { studentId: true } } },
  });
  if (!student) return false;
  if (permissionCode === "students.self.read" || permissionCode === "results.self.read") {
    return student.userId === userId && hasPermission(userId, permissionCode, { type: "SELF", id: userId });
  }
  if (!parentPermissionCodes.has(permissionCode) || student.parents.length === 0) return false;
  return hasPermission(userId, permissionCode, { type: "SELF", id: userId });
}

const parentPermissionCodes = new Set([
  "students.linked.read",
  "finance.statement.linked.read",
  "finance.payment.linked.initiate",
  "finance.payment.linked.confirm",
]);

export async function hasLinkedChildPermission(
  parentUserId: string,
  permissionCode: string,
  studentProfileId: string,
): Promise<boolean> {
  if (!parentPermissionCodes.has(permissionCode)) return false;
  const { prisma } = await import("@greenfield/database");
  const link = await prisma.parentStudent.findUnique({
    where: { parentUserId_studentId: { parentUserId, studentId: studentProfileId } },
    select: { studentId: true },
  });
  if (!link) return false;
  return hasPermission(parentUserId, permissionCode, { type: "SELF", id: parentUserId });
}

export async function recordBreakGlassAccess(input: {
  actorUserId: string;
  resourceType: string;
  resourceId?: string;
  target: PermissionScope;
  reason: string;
}): Promise<boolean> {
  const reason = input.reason.trim();
  if (reason.length < 10 || reason.length > 500) {
    throw new Error("Break-glass access requires a reason of 10 to 500 characters.");
  }
  const allowed = await hasPermission(input.actorUserId, "data.break_glass", input.target);
  const { prisma } = await import("@greenfield/database");
  await prisma.auditLog.create({
    data: {
      actorUserId: input.actorUserId,
      action: allowed ? "data.break_glass.granted" : "data.break_glass.denied",
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      scopeType: input.target.type,
      scopeId: input.target.id,
      metadata: { reason },
    },
  });
  return allowed;
}

