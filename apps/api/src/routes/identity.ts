import express from "express";
import { hashSessionToken } from "../auth.js";
import { hasPermission, resolveResourceScope } from "../authorization.js";

const router = express.Router();
const { prisma } = await import("@greenfield/database");
const scopeTypes = new Set(["PLATFORM", "SCHOOL", "CAMPUS", "SECTION", "CLASS_GROUP", "SELF"]);

async function authenticatedUserId(request: express.Request): Promise<string | null> {
  const match = request.header("authorization")?.match(/^Bearer\s+([A-Za-z0-9_-]+)$/i);
  if (!match) return null;
  const session = await prisma.session.findFirst({
    where: { tokenHash: hashSessionToken(match[1]), expiresAt: { gt: new Date() } },
    select: { userId: true },
  });
  return session?.userId ?? null;
}

function fail(response: express.Response, status: number, code: string, message: string) {
  response.status(status).json({ error: { code, message } });
}

router.get("/me", async (request, response) => {
  const userId = await authenticatedUserId(request);
  if (!userId) return fail(response, 401, "UNAUTHENTICATED", "A valid bearer token is required.");
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, email: true, name: true,
      campusMemberships: { select: {
        role: true,
        campus: { select: { id: true, name: true, slug: true, school: { select: { id: true, name: true, slug: true } } } },
      } },
      roleAssignments: { where: { revokedAt: null }, select: {
        id: true, roleKey: true, scopeType: true, scopeId: true, createdAt: true,
        role: { select: { description: true } },
      } },
    },
  });
  if (!user) return fail(response, 401, "UNAUTHENTICATED", "The account is no longer available.");
  const assignments = await Promise.all(user.roleAssignments.map(async (assignment) => {
    const target = assignment.scopeType === "PLATFORM"
      ? { type: "PLATFORM" as const }
      : assignment.scopeId
        ? await resolveResourceScope(assignment.scopeType as "SCHOOL" | "CAMPUS" | "SECTION" | "CLASS_GROUP" | "SELF", assignment.scopeId)
        : null;
    const permissions = target ? await import("../authorization.js").then(({ getEffectivePermissions }) => getEffectivePermissions(userId, target)) : [];
    return { ...assignment, permissions };
  }));
  response.setHeader("Cache-Control", "private, no-store");
  return response.json({ data: { user: { id: user.id, email: user.email, name: user.name },
    campusMemberships: user.campusMemberships, roleAssignments: assignments } });
});

router.get("/role-assignments", async (request, response) => {
  const actorId = await authenticatedUserId(request);
  if (!actorId) return fail(response, 401, "UNAUTHENTICATED", "A valid bearer token is required.");
  const targetUserId = typeof request.query.userId === "string" ? request.query.userId : actorId;
  const canManage = await hasPermission(actorId, "roles.assign", { type: "PLATFORM" });
  if (targetUserId !== actorId && !canManage) return fail(response, 403, "FORBIDDEN", "You cannot view another user's role assignments.");
  const assignments = await prisma.roleAssignment.findMany({
    where: { userId: targetUserId, ...(request.query.includeRevoked === "true" && canManage ? {} : { revokedAt: null }) },
    orderBy: { createdAt: "desc" },
    select: { id: true, userId: true, roleKey: true, scopeType: true, scopeId: true, createdAt: true, revokedAt: true, role: { select: { description: true } } },
  });
  response.setHeader("Cache-Control", "private, no-store");
  return response.json({ data: assignments });
});

router.post("/role-assignments", async (request, response) => {
  const actorId = await authenticatedUserId(request);
  if (!actorId) return fail(response, 401, "UNAUTHENTICATED", "A valid bearer token is required.");
  const { userId, roleKey, scopeType, scopeId } = request.body ?? {};
  if (typeof userId !== "string" || typeof roleKey !== "string" || typeof scopeType !== "string" ||
    !scopeTypes.has(scopeType) || (scopeType === "PLATFORM" ? scopeId !== null : typeof scopeId !== "string" || scopeId.length < 1)) {
    return fail(response, 422, "VALIDATION_ERROR", "Provide userId, a known roleKey, scopeType, and a valid scopeId.");
  }
  if (actorId === userId) return fail(response, 403, "SELF_ASSIGNMENT_FORBIDDEN", "Administrators cannot assign roles to themselves.");
  if (scopeType === "SELF" && scopeId !== userId) return fail(response, 422, "INVALID_ROLE_SCOPE", "A self-scoped assignment must target the assigned user's own ID.");
  const target = scopeType === "PLATFORM" ? { type: "PLATFORM" as const } : await resolveResourceScope(scopeType as "SCHOOL" | "CAMPUS" | "SECTION" | "CLASS_GROUP" | "SELF", scopeId as string);
  if (!target) return fail(response, 404, "SCOPE_NOT_FOUND", "The requested scope was not found.");
  if (!(await hasPermission(actorId, "roles.assign", target))) return fail(response, 403, "FORBIDDEN", "You cannot assign roles at this scope.");
  if (scopeType === "PLATFORM" && roleKey !== "PLATFORM_ADMIN") return fail(response, 422, "INVALID_ROLE_SCOPE", "Only Platform / System Administrator may be assigned at platform scope.");
  if (scopeType !== "PLATFORM" && roleKey === "PLATFORM_ADMIN") return fail(response, 422, "INVALID_ROLE_SCOPE", "Platform / System Administrator requires platform scope.");
  const [targetUser, role] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { id: true } }),
    prisma.roleDefinition.findUnique({ where: { key: roleKey }, select: { key: true } }),
  ]);
  if (!targetUser || !role) return fail(response, 404, "USER_OR_ROLE_NOT_FOUND", "The requested user or official role was not found.");
  const assignment = await prisma.$transaction(async (tx) => {
    const created = await tx.roleAssignment.create({ data: { userId, roleKey, scopeType, scopeId: scopeId as string | null }, select: { id: true, userId: true, roleKey: true, scopeType: true, scopeId: true, createdAt: true } });
    await tx.auditLog.create({ data: { actorUserId: actorId, action: "role_assignment.created", resourceType: "RoleAssignment", resourceId: created.id, scopeType, scopeId: scopeId as string | null, metadata: { roleKey, targetUserId: userId } } });
    return created;
  });
  return response.status(201).json({ data: assignment });
});

router.post("/role-assignments/:assignmentId/revoke", async (request, response) => {
  const actorId = await authenticatedUserId(request);
  if (!actorId) return fail(response, 401, "UNAUTHENTICATED", "A valid bearer token is required.");
  const assignment = await prisma.roleAssignment.findUnique({ where: { id: request.params.assignmentId }, select: { id: true, userId: true, scopeType: true, scopeId: true, roleKey: true, revokedAt: true } });
  if (!assignment) return fail(response, 404, "NOT_FOUND", "Role assignment not found.");
  if (assignment.userId === actorId) return fail(response, 403, "SELF_REVOCATION_FORBIDDEN", "Administrators cannot revoke their own role assignment.");
  const target = assignment.scopeType === "PLATFORM" ? { type: "PLATFORM" as const } : assignment.scopeId
    ? await resolveResourceScope(assignment.scopeType as "SCHOOL" | "CAMPUS" | "SECTION" | "CLASS_GROUP" | "SELF", assignment.scopeId) : null;
  if (!target || !(await hasPermission(actorId, "roles.assign", target))) return fail(response, 403, "FORBIDDEN", "You cannot revoke this role assignment.");
  if (assignment.revokedAt) return response.json({ data: assignment });
  const revokedAt = new Date();
  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.roleAssignment.update({ where: { id: assignment.id }, data: { revokedAt }, select: { id: true, userId: true, roleKey: true, scopeType: true, scopeId: true, createdAt: true, revokedAt: true } });
    await tx.auditLog.create({ data: { actorUserId: actorId, action: "role_assignment.revoked", resourceType: "RoleAssignment", resourceId: assignment.id, scopeType: assignment.scopeType, scopeId: assignment.scopeId, metadata: { roleKey: assignment.roleKey, targetUserId: assignment.userId } } });
    return result;
  });
  return response.json({ data: updated });
});

export default router;
