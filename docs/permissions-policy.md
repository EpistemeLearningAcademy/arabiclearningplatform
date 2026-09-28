# Greenfield authorization policy (approved)

The matrix below reflects the School's approved decisions. Permission grants are explicit in RolePermission and are still bounded by each user's RoleAssignment scope. Unmatched permissions are denied. Multiple roles add grants; finance permissions are assigned only to Finance Officer.

## Confirmed policy

- **School Administrator and finance:** a School Administrator alone has no finance permissions. A person who administers finance must also hold a separate Finance Officer role assignment in the same School/Campus scope. Finance read, manage, and report permissions are granted only to Finance Officer.
- **Principal result publishing:** Principals may publish results at any academic scope within their assigned School, including its campuses, sections, and class groups. A principal assignment at a School scope covers these child scopes; it does not cross into another School.
- **Transport student details:** For an assigned route/run only, Drivers and Transport Managers may access the student's name, class, admission number, and the linked parent's/guardian's name and contact. Address and pickup/drop-off instructions are available only when needed for the assigned route. Authorized pickup persons, emergency contacts, and a narrowly relevant safety alert may be shown when needed for safe transport. Grades, fees, general student notes, credentials, and unrelated profile data are excluded. Do not expose detailed medical records.
- **Platform Administrator break-glass:** Platform Administrators may access any record content, including student and finance information, only through the break-glass authorization helper. Each attempt requires a reason of 10–500 characters and creates a granted/denied AuditLog event with actor, resource, scope, timestamp, and reason. The helper fails closed if permission lookup or audit writing fails. A Platform Administrator role assignment must have PLATFORM scope. This is an emergency workflow; ordinary feature routes must not silently treat platform scope as permission to display sensitive records.
- **Parents and payments:** Parents may view fee statements and initiate or submit confirmation for payments only for children explicitly linked in ParentStudent. The server/payment provider must verify settlement; a parent's confirmation alone must never mark an invoice paid.

## Role grants

| Role | Granted permission families | Required scope/relationship |
| --- | --- | --- |
| Platform / System Administrator | Platform provisioning/security, role assignment, audit read, audited break-glass | PLATFORM; sensitive record access through reason-logged helper |
| School Administrator | School/campus settings, users/memberships, school-scoped student and academic read | Assigned School |
| Principal | School/campus read, school student read, academic structure read/manage, assessments/results read, results publish | Assigned School; publishing may target any child academic scope in that School |
| Campus Head | Campus settings, users read, campus student read, academic structure read | Assigned Campus |
| Academic Coordinator | Academic structure and assignment management, scoped student academic read, assessment management, results read | Assigned academic School/Section/Campus |
| Teacher | Assigned class roster read, lessons, attendance, assignments and assessments management, assigned results read | Assigned subject/class group |
| Form Teacher | Assigned roster read, attendance and pastoral notes management, assigned results read | Assigned class group |
| Finance Officer | Finance read/manage/report | Explicitly assigned School/Campus |
| Parent | Linked child profile, fee statement, payment initiation and payment confirmation submission | ParentStudent link to that child; payment settlement independently verified |
| Student | Own profile/results and own assignment submission | Authenticated user's own profile |
| Driver | Assigned route/run and minimum transport student details | Assigned transport run |
| Transport Manager | Transport operations and minimum transport student details | Assigned School/Campus and route/run as applicable |
| Admissions Officer | Applicant read/manage | Assigned School/Campus |
| Content/Media Manager | Content read/manage/publish | Assigned school/site |

## Implementation boundary

The migrations create the permission catalog and role grants. The API now resolves supported academic resources from database relationships and applies permission plus scope checks to identity, role-assignment, and the first academic routes. Parent linked-child checks and break-glass logging remain helpers; no student-content route invokes them. The academic routes are limited to the paths listed in `docs/frontend-integration-contract.md`; academic update/delete routes are intentionally absent. Finance, transport, admissions, and content APIs are not implemented, and this policy does not create payment processing, transport tracking, or other feature workflows.

