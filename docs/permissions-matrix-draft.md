> Superseded by the approved policy in docs/permissions-policy.md. This file is retained as the original draft for history.

# Greenfield role and permission matrix — draft for approval

**Draft only. No permission grants have been applied.**

This is a least-privilege starting policy, not a claim about current school rules. A role takes effect only when permissions are explicitly granted to it and the user's assignment covers the target scope. Multiple roles add grants; a narrower role does not cancel a broader grant held through another role. Authorization defaults to deny.

## Scopes

- Platform: platform configuration and school/campus provisioning. It does not automatically expose student or finance record contents.
- School: one named School, and only those child campuses supported by the permission.
- Campus: one assigned Campus.
- Section and class group: only the named academic unit.
- Self and linked children: the signed-in student or students explicitly linked through ParentStudent.

The API must resolve each target's actual ancestry and parent/student/assignment relationship. A client-supplied scope ID is never proof of access.

## Proposed defaults

| Official role | Proposed access | Scope | Exclusions |
| --- | --- | --- | --- |
| Platform / System Administrator | Provision schools and campuses; manage platform configuration, accounts, role catalog, security operations | Platform | Student or finance record contents require separately approved, audited support access |
| School Administrator | Manage school profile, campuses, memberships, and settings; read school operational and academic records | Assigned School | Finance transactions excluded by default; no cross-school access |
| Principal | Read student/staff and academic records; manage academic operations | Assigned School or explicitly assigned campuses | Finance transactions and platform configuration excluded |
| Campus Head | Manage campus operations, staff, and rosters; read campus academic records | Assigned Campus | Finance transactions, other campuses, and platform access excluded |
| Academic Coordinator | Manage approved academic structure and teaching assignments; read academic progress | Assigned School/Section or Campus | Finance, admissions, transport, and platform settings excluded |
| Teacher | View assigned rosters; manage own lessons, attendance, assignments, and assessment drafts | Assigned subject/class group | Other classes, finance, and unrestricted student search excluded; result publishing awaits policy |
| Form Teacher | View and maintain assigned roster, attendance, and academic/pastoral notes | Assigned class group | Other classes, finance, and school-wide student search excluded |
| Finance Officer | Manage fee schedules, invoices, receipts, and finance reports | Explicitly assigned School/Campus | Grades, lesson content, admissions, and private notes excluded |
| Parent | View linked children's profiles, attendance, learning information, and fee statements | Linked children only | Unrelated students and staff-only records excluded |
| Student | View own profile, enrolment, classes, learning resources, assignments, and results; submit assigned work | Self and assigned learning resources | Other students' records and administration excluded |
| Driver | View assigned route and minimum roster/contact details needed for that run | Assigned transport run | General profiles, grades, finance, and school-wide search excluded |
| Transport Manager | Manage routes, runs, assignments, and necessary transport details | Assigned School/Campus | Academic, finance, and unrelated student records excluded |
| Admissions Officer | Manage applicant records and admission decisions | Explicitly assigned School/Campus | Enrolled-student academic records, finance transactions, and platform access excluded |
| Content/Media Manager | Manage approved CMS content, media, and publication workflow | Assigned School/site | Student records/private media without consent workflow and finance excluded |

## Permission catalog proposal

Candidate code groups: platform.provision, platform.security.manage, school.read/manage, campus.read/manage, users.read, memberships.manage, roles.assign, academic.structure.read/manage, academic.assignments.manage, students.read/manage, attendance.read/manage, lessons.read/manage, assessments.read/manage, results.read/manage/publish, finance.read/manage, finance.reports.read, admissions.read/manage, transport.read/manage, content.read/manage/publish, audit.read.

A permission code alone never grants access; each request must also pass scope and relationship checks, such as linked child, assigned class, assigned route, or self.

## Decisions needed before seeding grants

1. Should School Administrators see/manage finance records, or must they also hold Finance Officer?
2. May Principals publish results, and at what scope?
3. What minimum student details may Drivers and Transport Managers see?
4. Should Platform Administrators have audited break-glass access to student/finance record contents?
5. Should Parents see fee statements only, or also make/confirm payments?

Keep these sensitive permissions ungranted until those decisions are made.


