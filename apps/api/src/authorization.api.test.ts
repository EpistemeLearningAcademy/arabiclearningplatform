import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import { test } from "node:test";
import { createSessionToken, hashSessionToken } from "./auth.js";

loadEnv({ path: resolve(process.cwd(), "../../.env") });
const baseUrl = process.env.GREENFIELD_TEST_API_URL;
const enabled = process.env.RUN_DATABASE_TESTS === "1" && Boolean(baseUrl);

test("campus permissions endpoint is member-scoped and logout revokes the session", { skip: !enabled }, async () => {
  const connectionString = process.env.DATABASE_URL;
  assert.ok(connectionString);
  const host = new URL(connectionString).hostname;
  assert.ok(host === "localhost" || host === "127.0.0.1", "integration test only supports local PostgreSQL");
  const { prisma } = await import("@greenfield/database");
  const campuses = await prisma.campus.findMany({ take: 2, orderBy: { id: "asc" }, select: { id: true } });
  assert.ok(campuses.length >= 2, "requires two local campuses for the membership boundary check");

  const email = `api-authz-test-${randomUUID()}@invalid.local`;
  let userId: string | undefined;
  let sessionId: string | undefined;
  const token = createSessionToken();
  try {
    const user = await prisma.user.create({
      data: { email, passwordHash: "test-only-invalid" },
      select: { id: true },
    });
    userId = user.id;
    await prisma.campusMembership.create({
      data: { campusId: campuses[0].id, userId, role: "SCHOOL_ADMIN" },
    });
    await prisma.roleAssignment.create({
      data: { userId, roleKey: "SCHOOL_ADMIN", scopeType: "CAMPUS", scopeId: campuses[0].id },
    });
    const session = await prisma.session.create({
      data: {
        userId,
        tokenHash: hashSessionToken(token),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
      select: { id: true },
    });
    sessionId = session.id;

    const headers = { Authorization: `Bearer ${token}` };
    const own = await fetch(`${baseUrl}/campuses/${campuses[0].id}/permissions`, { headers });
    assert.equal(own.status, 200);
    const payload = await own.json() as { permissions: string[] };
    assert.ok(payload.permissions.includes("campus.manage"));
    assert.ok(payload.permissions.includes("campus.read"));
    assert.ok(!payload.permissions.includes("finance.manage"));

    const ownProfile = await fetch(`${baseUrl}/campuses/${campuses[0].id}/me`, { headers });
    assert.equal(ownProfile.status, 200);

    const other = await fetch(`${baseUrl}/campuses/${campuses[1].id}/permissions`, { headers });
    assert.equal(other.status, 403);

    const logout = await fetch(`${baseUrl}/auth/logout`, { method: "POST", headers });
    assert.equal(logout.status, 200);
    const afterLogout = await fetch(`${baseUrl}/campuses/${campuses[0].id}/permissions`, { headers });
    assert.equal(afterLogout.status, 401);
  } finally {
    if (sessionId) await prisma.session.deleteMany({ where: { id: sessionId } });
    if (userId) await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.$disconnect();
  }
});

