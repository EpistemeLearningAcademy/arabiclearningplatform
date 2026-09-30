BEGIN;
-- Create campus tables before moving the existing school memberships.
CREATE TABLE "Campus" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Campus_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CampusMembership" (
    "id" TEXT NOT NULL,
    "campusId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "SchoolRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CampusMembership_pkey" PRIMARY KEY ("id")
);

-- Convert the two existing school records into campuses under one Greenfield school.
DO $$
DECLARE
    main_school_id TEXT;
    annex_school_id TEXT;
BEGIN
    SELECT "id" INTO main_school_id FROM "School" WHERE "slug" = 'greenfield-schools-ibadan';
    SELECT "id" INTO annex_school_id FROM "School" WHERE "slug" = 'greenfield-montessori-early-years';

    IF main_school_id IS NULL AND annex_school_id IS NULL THEN
        NULL;
    ELSIF main_school_id IS NULL OR annex_school_id IS NULL THEN
        RAISE EXCEPTION 'Expected both Greenfield main and Annex school records; no campus data was moved.';
    ELSE
        IF EXISTS (SELECT 1 FROM "School" WHERE "slug" = 'greenfield' AND "id" <> main_school_id) THEN
            RAISE EXCEPTION 'The school ID greenfield is already in use.';
        END IF;

        INSERT INTO "Campus" ("id", "schoolId", "name", "slug", "createdAt", "updatedAt")
        VALUES
            (main_school_id, main_school_id, 'Greenfield Schools, Ibadan', 'greenfield-schools-ibadan', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            (annex_school_id, main_school_id, 'Greenfield Montessori and Early Years', 'greenfield-montessori-early-years', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

        INSERT INTO "CampusMembership" ("id", "campusId", "userId", "role", "createdAt")
        SELECT "id", "schoolId", "userId", "role", "createdAt"
        FROM "SchoolMembership";

        UPDATE "School"
        SET "name" = 'Greenfield', "slug" = 'greenfield', "updatedAt" = CURRENT_TIMESTAMP
        WHERE "id" = main_school_id;

        DELETE FROM "School" WHERE "id" = annex_school_id;
    END IF;
END $$;

ALTER TABLE "SchoolMembership" DROP CONSTRAINT "SchoolMembership_schoolId_fkey";
ALTER TABLE "SchoolMembership" DROP CONSTRAINT "SchoolMembership_userId_fkey";
DROP TABLE "SchoolMembership";

CREATE INDEX "Campus_schoolId_idx" ON "Campus"("schoolId");
CREATE UNIQUE INDEX "Campus_schoolId_slug_key" ON "Campus"("schoolId", "slug");
CREATE INDEX "CampusMembership_userId_idx" ON "CampusMembership"("userId");
CREATE INDEX "CampusMembership_campusId_role_idx" ON "CampusMembership"("campusId", "role");
CREATE UNIQUE INDEX "CampusMembership_campusId_userId_key" ON "CampusMembership"("campusId", "userId");

ALTER TABLE "Campus" ADD CONSTRAINT "Campus_schoolId_fkey"
    FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CampusMembership" ADD CONSTRAINT "CampusMembership_campusId_fkey"
    FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CampusMembership" ADD CONSTRAINT "CampusMembership_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;
