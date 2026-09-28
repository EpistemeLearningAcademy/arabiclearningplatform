# Greenfield authorization model

The server makes authorization decisions using:

**Authenticated user → active role assignment → permission grant → requested resource → database-resolved scope → allow or deny.**

`CampusMembership` records a user's organisational campus membership and supports campus selection. It is not the source of feature permissions. `RoleDefinition`, `RolePermission`, and `RoleAssignment` are the authorization source of truth. Every permission query filters revoked assignments. Revocation is retained as history in `RoleAssignment.revokedAt`.

## Resource scope resolution

Callers identify a resource by its type and ID. The API resolves its school/campus ancestry from Prisma relations. It ignores ancestry fields on caller-supplied targets. Missing resources and mismatched academic relationships deny access. The initial resolver supports School, Campus, Academic Section, Class Group, Academic Year, Term, Academic Level, Subject, Subject Assignment, Student Profile, and Student Enrollment. Transport Run resolution returns no scope until a real transport model and assignment relations exist.

Scope types in current assignments are `PLATFORM`, `SCHOOL`, `CAMPUS`, `SECTION`, `CLASS_GROUP`, and `SELF`; `TRANSPORT_RUN` is reserved but not operational. A platform assignment has a null scope ID and is granted only to the Platform / System Administrator. `SELF` must match the authenticated user. School and campus ancestors apply only after server resolution.

## Official roles and current boundary

These are the only official application role keys:

| Role | Key | Intended scope / relationship |
|---|---|---|
| Platform / System Administrator | `PLATFORM_ADMIN` | Platform assignment; sensitive record reads require reason-logged break-glass flow. |
| School Administrator | `SCHOOL_ADMIN` | Assigned school or campus; finance additionally requires a separate Finance Officer assignment. |
| Principal | `PRINCIPAL` | Assigned school; may publish results throughout that school's academic hierarchy when results APIs exist. |
| Campus Head | `CAMPUS_HEAD` | Assigned campus. |
| Academic Coordinator | `ACADEMIC_COORDINATOR` | Assigned academic scope. |
| Teacher | `TEACHER` | Assigned classes/subjects. |
| Form Teacher | `FORM_TEACHER` | Assigned form/class. |
| Finance Officer | `FINANCE_OFFICER` | Explicit finance scope. |
| Parent | `PARENT` | Only students linked by `ParentStudent`. |
| Student | `STUDENT` | Only the profile linked to the authenticated account. |
| Driver | `DRIVER` | Assigned transport run; transport model is not implemented. |
| Transport Manager | `TRANSPORT_MANAGER` | Assigned transport scope; transport model is not implemented. |
| Admissions Officer | `ADMISSIONS_OFFICER` | Assigned school/campus; admissions APIs are not implemented. |
| Content/Media Manager | `CONTENT_MEDIA_MANAGER` | Assigned school/site; content APIs are not implemented. |

Permission grants remain the approved catalog seeded by migrations. A role name alone never grants access. Multiple active assignments add grants only within their own scopes. `CampusMembership.role` is retained as legacy membership context and must not be used as a permission check.

## Domain boundaries

- School/campus boundaries are resolved from stored parent relations. Database triggers added by the latest migration reject cross-school class groups, subject assignments, and student enrollments.
- Teacher assignments reference `User`, support more than one teacher for a class/subject, and have optional start/end dates. A selected teacher must already hold the class-roster permission at that class scope.
- Enrollment history allows multiple non-overlapping class periods per student and academic year. A database trigger serializes and rejects overlapping periods.
- Parent access requires an explicit `ParentStudent` relationship and a linked-child permission. Student self-access requires `StudentProfile.userId` to equal the authenticated user and a self-scoped permission.
- Finance, transport, admissions, content/media, results, and sensitive student profile feature routes are not implemented. Their permissions do not imply those resources exist.
- Break-glass helper requires a 10–500 character reason and writes an audit event before a caller may proceed. No sensitive-content endpoint currently invokes it; do not expose those records until such a route is implemented and tested.

## Role assignment administration

`POST /role-assignments` and `POST /role-assignments/:assignmentId/revoke` require `roles.assign` at the server-resolved target scope. The approved catalog currently grants that permission to Platform / System Administrator only. Users cannot assign or revoke their own roles. Platform role assignments require `PLATFORM` scope; all other roles are rejected at platform scope. Revocation is immediate in subsequent authorization queries and audited.

## Audit and data minimization

Role assignment changes, successful login, and academic creation operations write audit events. Do not put passwords, bearer tokens, student content, or unnecessary personal data in audit metadata. Academic enrollment reads return only student profile ID and name. Extend these field selections only after reviewing the permission and privacy requirements for that API.
