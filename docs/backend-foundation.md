# Greenfield backend foundation

## Architecture
The repository remains an npm workspaces monorepo: Next.js is the browser application and same-origin BFF in apps/web; Express is the API in apps/api; Prisma/PostgreSQL are in packages/database. School is the organisation and Campus is a location beneath it. Do not create a School per campus.

## Identity and sessions
The browser login route exchanges credentials with Express and stores the opaque session token in the greenfield_session HTTP-only, SameSite=Lax cookie. Client JavaScript receives user details, not the token. Express stores only a SHA-256 digest of the random token. The API logout endpoint removes the matching server-side session; the web logout proxy clears the cookie. Sessions expire after seven days. Use HTTPS in production so the cookie Secure flag is enabled. Passwords use Node scrypt with random salt and timing-safe comparison.

## Roles, permissions, and scope
RoleDefinition, Permission, and RolePermission define role-to-permission policy. RoleAssignment binds a person to a role and a scope type/ID (platform, school, campus, section, class group, or self); `revokedAt` preserves revoked assignment history. Migrations seed the 14 official roles, 45 permissions, and approved role grants. CampusMembership represents organisational campus context, not feature permissions. Do not treat a role name alone as authorization. See `docs/authorization-model.md` for the authoritative authorization model.

Scope IDs are polymorphic strings because an assignment may target different resource types. The authorization helper resolves supported resource IDs and ancestry from database relationships. Never accept client-provided ancestry as proof of authority. Transport-run scope resolution is not implemented.

## Academic minimum
AcademicYear and Term are school-scoped. AcademicSection and Subject are school-scoped. AcademicLevel belongs to a section; ClassGroup belongs to a campus and level; SubjectAssignment supports multiple teachers and date-bounded assignment history; StudentEnrollment supports non-overlapping class history within an academic year. A new migration adds school-consistency and enrollment-overlap triggers. Grading, promotion, term counts, and curriculum rules remain undefined.

## API contract currently implemented
All paths below are Express API paths. Legacy endpoints retain earlier response shapes for compatibility. New identity and academic routes use `{ data: ... }` and structured `{ error: { code, message } }` responses; see `docs/frontend-integration-contract.md`.

| Method | Path | Auth | Scope and behavior |
| --- | --- | --- | --- |
| GET | /health | No | Liveness |
| GET | /health/ready | No | Database readiness |
| POST | /auth/login | No | JSON { email, password }; returns internal token, expiry, and user for the BFF |
| POST | /auth/logout | Bearer session | Revokes/removes only the presented session |
| GET | /campuses | Bearer session | Returns only the caller's campus memberships |
| GET | /campuses/:campusId/me | Bearer session | Requires membership in that campus; otherwise 403 |
| GET | /me | Bearer session | Caller, memberships, active assignments, and effective permissions by resolved scope |
| GET/POST | /role-assignments | Bearer session | Own assignments; assignment creation requires `roles.assign` at target scope |
| POST | /role-assignments/:assignmentId/revoke | Bearer session | Audited role-assignment revocation |
| GET/POST | /academic/years, /academic/sections, /academic/levels, /academic/classes, /academic/subjects | Bearer session | Scoped academic structure reads and creation |
| GET/POST | /academic/terms, /academic/years/:yearId/terms | Bearer session | Term reads and creation |
| GET/POST | /academic/teacher-assignments, /academic/enrollments | Bearer session | Scoped teacher assignment and limited enrollment reads/creation |

Use 401 for unauthenticated, 403 for authenticated but forbidden, 404 for missing resources/routes, 409 for enrollment conflicts, and 422 for invalid input. New collection endpoints bound `limit` to 1–100; only academic-year lists currently return a cursor. The BFF includes `/api/backend/...` allowlisted same-origin proxies for the new contract.

## Audit and security
AuditLog stores actor, action, resource, optional scope, JSON metadata, and timestamp. Successful login, role-assignment changes, and academic create operations emit events. Never store passwords, raw session tokens, or unnecessary child/finance data in metadata. Break-glass remains a helper not connected to sensitive-content routes. The API binds to loopback for local development and has no permissive CORS policy. Login throttling is in-memory per IP/email; multi-worker production needs a shared rate limiter.

## Migration and developer workflow
Never edit applied migration history. Add a timestamped migration, review SQL for destructive statements, then use npm run db:validate --workspace @greenfield/database, npm run db:generate --workspace @greenfield/database, and npx prisma migrate deploy --config prisma.config.ts from packages/database. Keep real credentials in ignored .env; .env.example contains placeholders.

## Tests and frontend boundary
Run npm test --workspace @greenfield/api for API utility tests. Database tests require a disposable PostgreSQL database on localhost named `greenfield_test_*`, `GREENFIELD_DISPOSABLE_DATABASE=1`, and `RUN_DATABASE_TESTS=1`; the test helper fails closed for other database names/hosts. Never point tests at the development database. The campus migration expects two initial Greenfield school rows before it runs, so a fresh migration-chain test must apply migrations 1 and 2, seed those two rows on the disposable database, and then apply the remaining migrations. Exact frontend-consumable paths are in `docs/frontend-integration-contract.md`. Academic update/delete, standalone student, results, finance, transport, admissions, content, notifications, and report APIs are not implemented.



Approved role policy: docs/permissions-policy.md.


## Effective permissions endpoint
GET /campuses/:campusId/permissions is an authenticated member-only endpoint. It resolves the campus and school scope on the server and returns only the signed-in user's effective permission codes for that campus. The Next.js BFF route is /api/campuses/:campusId/permissions and forwards the HTTP-only session cookie server-to-server. Both responses are private and non-cacheable.
