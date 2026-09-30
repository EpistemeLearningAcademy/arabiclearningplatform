import express from "express";
import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import {
  createSessionToken,
  hashSessionToken,
  verifyPassword,
} from "./auth.js";
import { getEffectivePermissions, hasPermission } from "./authorization.js";
import { LoginThrottle } from "./login-throttle.js";
import identityRoutes from "./routes/identity.js";
import academicRoutes from "./routes/academic.js";

loadEnv({ path: resolve(process.cwd(), "../../.env") });

const { prisma } = await import("@greenfield/database");

const app = express();
const port = Number(process.env.PORT ?? 4000);
const sessionLifetimeMs = 7 * 24 * 60 * 60 * 1000;

app.disable("x-powered-by");
app.use((_request, response, next) => {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Frame-Options", "DENY");
  response.setHeader("Referrer-Policy", "no-referrer");
  next();
});
app.use(express.json({ limit: "16kb", strict: true }));
app.use((_request, response, next) => {
  response.setHeader("Cache-Control", "private, no-store");
  next();
});

const loginThrottle = new LoginThrottle();
app.use("/auth/login", (request, response, next) => {
  const email = typeof request.body?.email === "string" ? request.body.email.trim().toLowerCase().slice(0, 254) : "";
  const now = Date.now();
  if (loginThrottle.isLimited(request.ip ?? "unknown", email, now)) {
    response.setHeader("Retry-After", "900");
    response.status(429).json({ error: { code: "RATE_LIMITED", message: "Too many sign-in attempts. Try again later." } });
    return;
  }
  next();
});

async function getSessionUserId(authorization: string | undefined): Promise<string | null> {
  const match = authorization?.match(/^Bearer\s+([A-Za-z0-9_-]+)$/i);
  if (!match) return null;

  const session = await prisma.session.findFirst({
    where: {
      tokenHash: hashSessionToken(match[1]),
      expiresAt: { gt: new Date() },
    },
    select: { userId: true },
  });
  return session?.userId ?? null;
}

app.get("/health", (_request, response) => {
  response.status(200).json({ status: "ok", service: "greenfield-api" });
});

app.get("/health/ready", async (_request, response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    response.status(200).json({ status: "ok", database: "connected" });
  } catch {
    response.status(503).json({ status: "not_ready", database: "unavailable" });
  }
});

app.post("/auth/login", async (request, response) => {
  const body = request.body as { email?: unknown; password?: unknown };
  if (!body || typeof body !== "object" ||
    typeof body.email !== "string" ||
    typeof body.password !== "string" ||
    body.email.trim().length === 0 ||
    body.email.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim()) ||
    body.password.length === 0 ||
    body.password.length > 1024
  ) {
    response.status(422).json({ error: { code: "VALIDATION_ERROR", message: "Email and password are required." } });
    return;
  }

  const email = body.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  const fallbackHash = `${"00".repeat(16)}:${"00".repeat(64)}`;
  const passwordMatches = await verifyPassword(
    body.password,
    user?.passwordHash ?? fallbackHash,
  );
  if (!user || !passwordMatches) {
    loginThrottle.recordFailure(request.ip ?? "unknown", email);
    response.status(401).json({ error: { code: "INVALID_CREDENTIALS", message: "Email or password is incorrect." } });
    return;
  }

  const token = createSessionToken();
  const expiresAt = new Date(Date.now() + sessionLifetimeMs);
  loginThrottle.clearAccount(request.ip ?? "unknown", email);
  await prisma.$transaction(async (tx) => {
    await tx.session.create({ data: { tokenHash: hashSessionToken(token), userId: user.id, expiresAt } });
    await tx.auditLog.create({ data: { actorUserId: user.id, action: "auth.login.succeeded", resourceType: "User", resourceId: user.id, metadata: {} } });
  });

  response.status(200).json({
    token,
    expiresAt: expiresAt.toISOString(),
    user: { id: user.id, email: user.email, name: user.name },
  });
});

app.post("/auth/logout", async (request, response) => {
  const match = request.header("authorization")?.match(/^Bearer\s+([A-Za-z0-9_-]+)$/i);
  if (!match) {
    response.status(401).json({ error: "A valid bearer token is required." });
    return;
  }
  await prisma.session.deleteMany({ where: { tokenHash: hashSessionToken(match[1]) } });
  response.status(200).json({ ok: true });
});

app.get("/campuses", async (request, response) => {
  const userId = await getSessionUserId(request.header("authorization"));
  if (!userId) {
    response.status(401).json({ error: "A valid bearer token is required." });
    return;
  }

  const memberships = await prisma.campusMembership.findMany({
    where: { userId },
    orderBy: { campus: { name: "asc" } },
    select: {
      role: true,
      campus: {
        select: {
          id: true,
          name: true,
          slug: true,
          school: { select: { id: true, name: true, slug: true } },
        },
      },
    },
  });

  response.status(200).json({
    campuses: memberships.map(({ campus, role }) => ({ ...campus, role })),
  });
});

app.get("/campuses/:campusId/permissions", async (request, response) => {
  const userId = await getSessionUserId(request.header("authorization"));
  if (!userId) {
    response.status(401).json({ error: "A valid bearer token is required." });
    return;
  }
  const campus = await prisma.campus.findUnique({
    where: { id: request.params.campusId },
    select: { id: true, schoolId: true },
  });
  if (!campus) {
    response.status(404).json({ error: "Campus not found." });
    return;
  }
  const membership = await prisma.campusMembership.findUnique({
    where: { campusId_userId: { campusId: campus.id, userId } },
    select: { id: true },
  });
  if (!membership) {
    response.status(403).json({ error: "You are not a member of this campus." });
    return;
  }
  const campusScope = { type: "CAMPUS" as const, id: campus.id, campusId: campus.id, schoolId: campus.schoolId };
  if (!(await hasPermission(userId, "campus.read", campusScope))) {
    response.status(403).json({ error: "You do not have permission to read this campus." });
    return;
  }
  const permissions = await getEffectivePermissions(userId, campusScope);
  response.status(200).json({ permissions });
});

app.get("/campuses/:campusId/me", async (request, response) => {
  const userId = await getSessionUserId(request.header("authorization"));
  if (!userId) {
    response.status(401).json({ error: "A valid bearer token is required." });
    return;
  }

  const membership = await prisma.campusMembership.findUnique({
    where: {
      campusId_userId: {
        campusId: request.params.campusId,
        userId,
      },
    },
    select: {
      role: true,
      campus: {
        select: {
          id: true,
          name: true,
          slug: true,
          school: { select: { id: true, name: true, slug: true } },
        },
      },
    },
  });
  if (!membership) {
    response.status(403).json({ error: "You are not a member of this campus." });
    return;
  }

  const campusScope = { type: "CAMPUS" as const, id: membership.campus.id, campusId: membership.campus.id, schoolId: membership.campus.school.id };
  if (!(await hasPermission(userId, "campus.read", campusScope))) {
    response.status(403).json({ error: "You do not have permission to read this campus." });
    return;
  }
  response.status(200).json({ campus: membership.campus, role: membership.role });
});

app.use(identityRoutes);
app.use(academicRoutes);

app.use((_request, response) => {
  response.status(404).json({ error: { code: "NOT_FOUND", message: "The requested API route was not found." } });
});

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  if (response.headersSent) return;
  if (typeof error === "object" && error !== null && "type" in error && error.type === "entity.parse.failed") {
    response.status(400).json({ error: { code: "INVALID_JSON", message: "Request body must be valid JSON." } });
    return;
  }
  const prismaCode = typeof error === "object" && error !== null && "code" in error && typeof error.code === "string" ? error.code : "";
  if (prismaCode === "P2002") {
    response.status(409).json({ error: { code: "CONFLICT", message: "A record with those details already exists." } });
    return;
  }
  if (["P2003", "P2004", "P2014"].includes(prismaCode)) {
    response.status(422).json({ error: { code: "RELATIONSHIP_CONSTRAINT", message: "The requested record relationships are invalid." } });
    return;
  }
  if (prismaCode === "P2025") {
    response.status(404).json({ error: { code: "NOT_FOUND", message: "The requested record was not found." } });
    return;
  }
  console.error("Unhandled API error", error instanceof Error ? error.name : "unknown");
  response.status(500).json({ error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred." } });
});

app.listen(port, "127.0.0.1", () => {
  console.log(`Greenfield API listening at http://127.0.0.1:${port}`);
});
