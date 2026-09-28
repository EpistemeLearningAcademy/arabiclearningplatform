-- Preserve current campus role assignments in the extensible authorization model.
INSERT INTO "RoleAssignment" ("id", "userId", "roleKey", "scopeType", "scopeId", "createdAt")
SELECT 'campus_membership_' || membership."id", membership."userId", membership."role"::text,
       'CAMPUS', membership."campusId", membership."createdAt"
FROM "CampusMembership" AS membership
WHERE NOT EXISTS (
  SELECT 1 FROM "RoleAssignment" AS assignment
  WHERE assignment."userId" = membership."userId"
    AND assignment."roleKey" = membership."role"::text
    AND assignment."scopeType" = 'CAMPUS'
    AND assignment."scopeId" = membership."campusId"
);
