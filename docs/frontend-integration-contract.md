# Frontend integration contract (verified backend slice)

This contract describes the current API routes. The backend is authoritative for roles, permissions, assignments, and resource scope. Do not infer access from a role label or construct school ancestry in the browser.

## Authentication

The browser signs in through `POST /api/auth/login` with JSON `{ "email": "...", "password": "..." }`. The Next.js BFF sends credentials to Express `POST /auth/login`, keeps the opaque token in an HttpOnly, SameSite=Lax cookie, and returns user details without the token. Production cookies use Secure. Sign out with `POST /api/auth/logout`; the BFF revokes the API session and clears the cookie. Do not store bearer tokens in browser storage.

For the new backend slice, call the same-origin BFF `/api/backend/...`. It reads the HttpOnly cookie and forwards the bearer token server-to-server. The BFF accepts GET and POST only, allows only documented paths, checks same-origin on state-changing requests, and returns `Cache-Control: private, no-store`.

Responses use `{ "data": ... }` for successful new endpoints. Errors use `{ "error": { "code": "...", "message": "..." } }`. Statuses: 401 unauthenticated, 403 forbidden, 404 missing resource/route, 409 conflicting enrollment, 422 invalid input, 429 throttled, 500 unexpected server error. Legacy `/campuses` and existing auth/BFF responses retain their earlier response shapes for compatibility.

## Identity and context

- `GET /api/backend/me` returns `{ data: { user, campusMemberships, roleAssignments } }`. Each active assignment includes its role key, scope type/ID, and permissions effective at its server-resolved scope. Campus memberships are context/navigation only, not authorization grants.
- `GET /api/backend/role-assignments` returns the signed-in user's assignments. A Platform Administrator may request `?userId=...` to view another user's assignments. `?includeRevoked=true` is limited to that administrator.
- `POST /api/backend/role-assignments` creates an assignment. Current permission grants make this available only to an authorized Platform Administrator. Body: `{ "userId": "...", "roleKey": "TEACHER", "scopeType": "CLASS_GROUP", "scopeId": "..." }`. A user cannot assign themselves. `PLATFORM_ADMIN` requires `scopeType: "PLATFORM", "scopeId": null`.
- `POST /api/backend/role-assignments/{assignmentId}/revoke` revokes an assignment; the operation is audited and takes effect on the next authorization check.
- Existing `GET /api/campuses` and `GET /api/campuses/{campusId}/permissions` remain available. The current BFF campus paths proxy those legacy routes.

## Academic endpoints

All list endpoints require a scope identifier and enforce permissions against the scope resolved by the API. `limit` is 1–100 where supported.

| Method | BFF path | Scope/query/body | Result |
|---|---|---|---|
| GET | `/api/backend/academic/years?schoolId={id}` | School | Years with terms |
| POST | `/api/backend/academic/years` | `{ schoolId, name, startsAt?, endsAt? }` | Create year |
| GET | `/api/backend/academic/years/{yearId}/terms` | Academic year | Terms |
| POST | `/api/backend/academic/terms` | `{ academicYearId, name, sequence?, startsAt?, endsAt? }` | Create term |
| GET | `/api/backend/academic/sections?schoolId={id}` | School | Sections with levels |
| POST | `/api/backend/academic/sections` | `{ schoolId, name, code? }` | Create section |
| GET | `/api/backend/academic/levels?sectionId={id}` | Section | Levels with class groups |
| POST | `/api/backend/academic/levels` | `{ sectionId, name, code? }` | Create level |
| GET | `/api/backend/academic/classes?campusId={id}` | Campus | Classes with campus, level, active subject/teacher assignments |
| POST | `/api/backend/academic/classes` | `{ campusId, levelId, name, code? }` | Create class group |
| GET | `/api/backend/academic/subjects?schoolId={id}` | School | Subjects and assignments |
| POST | `/api/backend/academic/subjects` | `{ schoolId, name, code? }` | Create subject |
| GET | `/api/backend/academic/teacher-assignments?classGroupId={id}` | Class group | Subject/teacher assignments |
| POST | `/api/backend/academic/teacher-assignments` | `{ classGroupId, subjectId, teacherUserId, startsAt?, endsAt? }` | Assign a teacher |
| GET | `/api/backend/academic/enrollments?classGroupId={id}` | Class group plus student-read permission | Minimal enrollment context: student ID/name, year, dates |
| POST | `/api/backend/academic/enrollments` | `{ studentId, classGroupId, academicYearId, startsAt, endsAt? }` | Create non-overlapping enrollment period |

Example:

```json
{
  "data": [
    {
      "id": "academic-year-id",
      "name": "2026/2027",
      "startsAt": "2026-09-01T00:00:00.000Z",
      "endsAt": null,
      "terms": []
    }
  ],
  "page": { "limit": 50, "nextCursor": null }
}
```

## Frontend rules

- Use IDs from API responses; never submit `schoolId`, `campusId`, `sectionId`, or class ancestry as proof of authorization. Where a create request needs a parent ID, the API resolves and validates it.
- Render actions based on the returned permissions for user experience only. Every request is still subject to server checks.
- Treat 403 as denied and 404 as unavailable. Do not retry unauthorized writes.
- Do not cache identity, permission, role-assignment, enrollment, or student responses publicly.
- Show only fields returned by the API. Do not infer missing student/staff fields or fabricate workflows.

## Intentionally not implemented

Update/delete endpoints for academic records; academic CRUD details beyond the listed create/read operations; standalone student profile routes; grades/results and publishing; finance/payment processing; transport runs and route assignments; admissions; content/media; staff administration; password reset/email verification; parent/student portal workflows; audit-log browsing. Do not design frontend functionality that assumes those APIs exist.
