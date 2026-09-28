-- CreateTable
CREATE TABLE "FormTeacherAssignment" (
    "id" TEXT NOT NULL,
    "classGroupId" TEXT NOT NULL,
    "teacherUserId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),

    CONSTRAINT "FormTeacherAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FormTeacherAssignment_classGroupId_startsAt_endsAt_idx" ON "FormTeacherAssignment"("classGroupId", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "FormTeacherAssignment_teacherUserId_idx" ON "FormTeacherAssignment"("teacherUserId");

-- AddForeignKey
ALTER TABLE "FormTeacherAssignment" ADD CONSTRAINT "FormTeacherAssignment_classGroupId_fkey" FOREIGN KEY ("classGroupId") REFERENCES "ClassGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormTeacherAssignment" ADD CONSTRAINT "FormTeacherAssignment_teacherUserId_fkey" FOREIGN KEY ("teacherUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
