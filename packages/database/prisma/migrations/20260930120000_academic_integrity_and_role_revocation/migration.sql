-- Add revocation without deleting assignment history; authorization queries must filter revokedAt IS NULL.
ALTER TABLE "RoleAssignment" ADD COLUMN "revokedAt" TIMESTAMP(3);
CREATE INDEX "RoleAssignment_userId_revokedAt_idx" ON "RoleAssignment"("userId", "revokedAt");
ALTER TABLE "RoleAssignment" ADD CONSTRAINT "RoleAssignment_scope_shape_check" CHECK (
  ("scopeType" = 'PLATFORM' AND "scopeId" IS NULL AND "roleKey" = 'PLATFORM_ADMIN') OR
  ("scopeType" <> 'PLATFORM' AND "scopeId" IS NOT NULL AND "roleKey" <> 'PLATFORM_ADMIN')
);
CREATE UNIQUE INDEX "RoleAssignment_active_scope_key" ON "RoleAssignment"("userId", "roleKey", "scopeType", COALESCE("scopeId", '')) WHERE "revokedAt" IS NULL;

-- Allow co-teaching and preserve subject assignment periods.
DROP INDEX "SubjectAssignment_classGroupId_subjectId_key";
ALTER TABLE "SubjectAssignment" ADD COLUMN "startsAt" TIMESTAMP(3), ADD COLUMN "endsAt" TIMESTAMP(3);
ALTER TABLE "SubjectAssignment" ADD CONSTRAINT "SubjectAssignment_teacherUserId_fkey"
  FOREIGN KEY ("teacherUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "SubjectAssignment_classGroupId_subjectId_idx" ON "SubjectAssignment"("classGroupId", "subjectId");
CREATE INDEX "SubjectAssignment_teacherUserId_startsAt_endsAt_idx" ON "SubjectAssignment"("teacherUserId", "startsAt", "endsAt");
ALTER TABLE "SubjectAssignment" ADD CONSTRAINT "SubjectAssignment_dates_check"
  CHECK ("startsAt" IS NULL OR "endsAt" IS NULL OR "endsAt" >= "startsAt");

-- Keep enrollment history when a student transfers class during an academic year.
DROP INDEX "StudentEnrollment_studentId_academicYearId_key";
CREATE INDEX "StudentEnrollment_studentId_academicYearId_startsAt_endsAt_idx"
  ON "StudentEnrollment"("studentId", "academicYearId", "startsAt", "endsAt");
ALTER TABLE "StudentEnrollment" ADD CONSTRAINT "StudentEnrollment_dates_check"
  CHECK ("startsAt" IS NULL OR "endsAt" IS NULL OR "endsAt" >= "startsAt");

-- Serialize enrollment changes per student/year and reject overlapping class periods.
CREATE OR REPLACE FUNCTION greenfield_check_enrollment_overlap() RETURNS trigger AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(NEW."studentId" || ':' || NEW."academicYearId", 0));
  IF EXISTS (
    SELECT 1 FROM "StudentEnrollment" e
    WHERE e."studentId" = NEW."studentId" AND e."academicYearId" = NEW."academicYearId"
      AND e."id" <> COALESCE(NEW."id", '')
      AND COALESCE(e."startsAt", '-infinity'::timestamp) <= COALESCE(NEW."endsAt", 'infinity'::timestamp)
      AND COALESCE(e."endsAt", 'infinity'::timestamp) >= COALESCE(NEW."startsAt", '-infinity'::timestamp)
  ) THEN
    RAISE EXCEPTION 'Student enrollment periods for an academic year may not overlap' USING ERRCODE = '23P01';
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;
CREATE TRIGGER "StudentEnrollment_no_overlap" BEFORE INSERT OR UPDATE OF "studentId", "academicYearId", "startsAt", "endsAt"
  ON "StudentEnrollment" FOR EACH ROW EXECUTE FUNCTION greenfield_check_enrollment_overlap();

-- Guards enforce school consistency even for direct database writes.
CREATE OR REPLACE FUNCTION greenfield_check_class_group_school() RETURNS trigger AS $$
DECLARE campus_school TEXT; level_school TEXT;
BEGIN
  SELECT "schoolId" INTO campus_school FROM "Campus" WHERE "id" = NEW."campusId";
  SELECT s."schoolId" INTO level_school FROM "AcademicLevel" l
    JOIN "AcademicSection" s ON s."id" = l."sectionId" WHERE l."id" = NEW."levelId";
  IF campus_school IS NULL OR level_school IS NULL OR campus_school <> level_school THEN
    RAISE EXCEPTION 'ClassGroup campus and academic level must belong to the same school' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;
CREATE TRIGGER "ClassGroup_school_consistency" BEFORE INSERT OR UPDATE OF "campusId", "levelId"
  ON "ClassGroup" FOR EACH ROW EXECUTE FUNCTION greenfield_check_class_group_school();

CREATE OR REPLACE FUNCTION greenfield_check_subject_assignment_school() RETURNS trigger AS $$
DECLARE class_school TEXT; subject_school TEXT;
BEGIN
  SELECT c."schoolId" INTO class_school FROM "ClassGroup" g JOIN "Campus" c ON c."id" = g."campusId" WHERE g."id" = NEW."classGroupId";
  SELECT "schoolId" INTO subject_school FROM "Subject" WHERE "id" = NEW."subjectId";
  IF class_school IS NULL OR subject_school IS NULL OR class_school <> subject_school THEN
    RAISE EXCEPTION 'Subject and class group must belong to the same school' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;
CREATE TRIGGER "SubjectAssignment_school_consistency" BEFORE INSERT OR UPDATE OF "classGroupId", "subjectId"
  ON "SubjectAssignment" FOR EACH ROW EXECUTE FUNCTION greenfield_check_subject_assignment_school();

CREATE OR REPLACE FUNCTION greenfield_check_enrollment_school() RETURNS trigger AS $$
DECLARE class_school TEXT; year_school TEXT;
BEGIN
  SELECT c."schoolId" INTO class_school FROM "ClassGroup" g JOIN "Campus" c ON c."id" = g."campusId" WHERE g."id" = NEW."classGroupId";
  SELECT "schoolId" INTO year_school FROM "AcademicYear" WHERE "id" = NEW."academicYearId";
  IF class_school IS NULL OR year_school IS NULL OR class_school <> year_school THEN
    RAISE EXCEPTION 'Enrollment class group and academic year must belong to the same school' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;
CREATE TRIGGER "StudentEnrollment_school_consistency" BEFORE INSERT OR UPDATE OF "classGroupId", "academicYearId"
  ON "StudentEnrollment" FOR EACH ROW EXECUTE FUNCTION greenfield_check_enrollment_school();

-- Parent updates must not invalidate child school ancestry after an initially valid insert.
CREATE OR REPLACE FUNCTION greenfield_check_parent_school_change() RETURNS trigger AS $$
DECLARE mismatch BOOLEAN;
BEGIN
  IF TG_TABLE_NAME = 'Campus' AND NEW."schoolId" IS DISTINCT FROM OLD."schoolId" THEN
    SELECT EXISTS (
      SELECT 1 FROM "ClassGroup" g
      JOIN "AcademicLevel" l ON l."id" = g."levelId"
      JOIN "AcademicSection" s ON s."id" = l."sectionId"
      WHERE g."campusId" = NEW."id" AND s."schoolId" <> NEW."schoolId"
    ) OR EXISTS (
      SELECT 1 FROM "SubjectAssignment" a
      JOIN "ClassGroup" g ON g."id" = a."classGroupId"
      JOIN "Subject" s ON s."id" = a."subjectId"
      WHERE g."campusId" = NEW."id" AND s."schoolId" <> NEW."schoolId"
    ) OR EXISTS (
      SELECT 1 FROM "StudentEnrollment" e
      JOIN "ClassGroup" g ON g."id" = e."classGroupId"
      JOIN "AcademicYear" y ON y."id" = e."academicYearId"
      WHERE g."campusId" = NEW."id" AND y."schoolId" <> NEW."schoolId"
    ) INTO mismatch;
  ELSIF TG_TABLE_NAME = 'AcademicSection' AND NEW."schoolId" IS DISTINCT FROM OLD."schoolId" THEN
    SELECT EXISTS (
      SELECT 1 FROM "AcademicLevel" l
      JOIN "ClassGroup" g ON g."levelId" = l."id"
      JOIN "Campus" c ON c."id" = g."campusId"
      WHERE l."sectionId" = NEW."id" AND c."schoolId" <> NEW."schoolId"
    ) INTO mismatch;
  ELSIF TG_TABLE_NAME = 'AcademicLevel' AND NEW."sectionId" IS DISTINCT FROM OLD."sectionId" THEN
    SELECT EXISTS (
      SELECT 1 FROM "ClassGroup" g
      JOIN "Campus" c ON c."id" = g."campusId"
      JOIN "AcademicSection" s ON s."id" = NEW."sectionId"
      WHERE g."levelId" = NEW."id" AND c."schoolId" <> s."schoolId"
    ) INTO mismatch;
  ELSIF TG_TABLE_NAME = 'Subject' AND NEW."schoolId" IS DISTINCT FROM OLD."schoolId" THEN
    SELECT EXISTS (
      SELECT 1 FROM "SubjectAssignment" a
      JOIN "ClassGroup" g ON g."id" = a."classGroupId"
      JOIN "Campus" c ON c."id" = g."campusId"
      WHERE a."subjectId" = NEW."id" AND c."schoolId" <> NEW."schoolId"
    ) INTO mismatch;
  ELSIF TG_TABLE_NAME = 'AcademicYear' AND NEW."schoolId" IS DISTINCT FROM OLD."schoolId" THEN
    SELECT EXISTS (
      SELECT 1 FROM "StudentEnrollment" e
      JOIN "ClassGroup" g ON g."id" = e."classGroupId"
      JOIN "Campus" c ON c."id" = g."campusId"
      WHERE e."academicYearId" = NEW."id" AND c."schoolId" <> NEW."schoolId"
    ) INTO mismatch;
  END IF;
  IF COALESCE(mismatch, FALSE) THEN
    RAISE EXCEPTION 'School change would invalidate academic child relationships' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;
CREATE TRIGGER "Campus_parent_school_consistency" BEFORE UPDATE OF "schoolId" ON "Campus"
  FOR EACH ROW EXECUTE FUNCTION greenfield_check_parent_school_change();
CREATE TRIGGER "AcademicSection_parent_school_consistency" BEFORE UPDATE OF "schoolId" ON "AcademicSection"
  FOR EACH ROW EXECUTE FUNCTION greenfield_check_parent_school_change();
CREATE TRIGGER "AcademicLevel_parent_school_consistency" BEFORE UPDATE OF "sectionId" ON "AcademicLevel"
  FOR EACH ROW EXECUTE FUNCTION greenfield_check_parent_school_change();
CREATE TRIGGER "Subject_parent_school_consistency" BEFORE UPDATE OF "schoolId" ON "Subject"
  FOR EACH ROW EXECUTE FUNCTION greenfield_check_parent_school_change();
CREATE TRIGGER "AcademicYear_parent_school_consistency" BEFORE UPDATE OF "schoolId" ON "AcademicYear"
  FOR EACH ROW EXECUTE FUNCTION greenfield_check_parent_school_change();
