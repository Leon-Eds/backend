-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('Active', 'Promoted', 'Graduated', 'Left', 'Archived');

-- CreateTable
CREATE TABLE "StudentEnrollment" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "academicSessionId" UUID NOT NULL,
    "classId" UUID NOT NULL,
    "promotedToClassId" UUID,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'Active',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex early so the backfills can safely merge multiple historical sources.
CREATE UNIQUE INDEX "StudentEnrollment_studentId_academicSessionId_key"
ON "StudentEnrollment"("studentId", "academicSessionId");

-- Backfill the session/class currently attached to each existing student.
INSERT INTO "StudentEnrollment" (
    "id",
    "schoolId",
    "studentId",
    "academicSessionId",
    "classId",
    "status",
    "startedAt",
    "createdAt",
    "updatedAt"
)
SELECT
    gen_random_uuid(),
    student."schoolId",
    student."id",
    class."academicSessionId",
    student."classId",
    CASE
        WHEN student."status" = 'Graduated' THEN 'Graduated'::"EnrollmentStatus"
        WHEN student."status" = 'Left' THEN 'Left'::"EnrollmentStatus"
        WHEN student."status" = 'Archived' THEN 'Archived'::"EnrollmentStatus"
        ELSE 'Active'::"EnrollmentStatus"
    END,
    student."enrolledAt",
    student."enrolledAt",
    CURRENT_TIMESTAMP
FROM "Student" AS student
INNER JOIN "Class" AS class ON class."id" = student."classId"
WHERE student."classId" IS NOT NULL
  AND class."academicSessionId" IS NOT NULL;

-- Recover older session/class memberships from records that already carry both values.
INSERT INTO "StudentEnrollment" (
    "id", "schoolId", "studentId", "academicSessionId", "classId",
    "status", "startedAt", "createdAt", "updatedAt"
)
SELECT DISTINCT ON (result."studentId", result."academicSessionId")
    gen_random_uuid(), result."schoolId", result."studentId", result."academicSessionId",
    result."classId", 'Active'::"EnrollmentStatus", result."createdAt", result."createdAt",
    CURRENT_TIMESTAMP
FROM "Result" AS result
ORDER BY result."studentId", result."academicSessionId", result."createdAt" DESC
ON CONFLICT ("studentId", "academicSessionId") DO NOTHING;

INSERT INTO "StudentEnrollment" (
    "id", "schoolId", "studentId", "academicSessionId", "classId",
    "status", "startedAt", "createdAt", "updatedAt"
)
SELECT DISTINCT ON (score."studentId", score."academicSessionId")
    gen_random_uuid(), score."schoolId", score."studentId", score."academicSessionId",
    score."classId", 'Active'::"EnrollmentStatus", score."createdAt", score."createdAt",
    CURRENT_TIMESTAMP
FROM "Score" AS score
ORDER BY score."studentId", score."academicSessionId", score."createdAt" DESC
ON CONFLICT ("studentId", "academicSessionId") DO NOTHING;

INSERT INTO "StudentEnrollment" (
    "id", "schoolId", "studentId", "academicSessionId", "classId",
    "status", "startedAt", "createdAt", "updatedAt"
)
SELECT DISTINCT ON (attendance."studentId", class."academicSessionId")
    gen_random_uuid(), attendance."schoolId", attendance."studentId", class."academicSessionId",
    attendance."classId", 'Active'::"EnrollmentStatus", attendance."date", attendance."createdAt",
    CURRENT_TIMESTAMP
FROM "Attendance" AS attendance
INNER JOIN "Class" AS class ON class."id" = attendance."classId"
WHERE class."academicSessionId" IS NOT NULL
ORDER BY attendance."studentId", class."academicSessionId", attendance."date" ASC
ON CONFLICT ("studentId", "academicSessionId") DO NOTHING;

-- A recovered membership in a class other than the student's current class is historical.
UPDATE "StudentEnrollment" AS enrollment
SET
    "status" = 'Promoted'::"EnrollmentStatus",
    "endedAt" = session."endDate",
    "promotedToClassId" = student."classId",
    "updatedAt" = CURRENT_TIMESTAMP
FROM "Student" AS student, "AcademicSession" AS session
WHERE enrollment."studentId" = student."id"
  AND enrollment."academicSessionId" = session."id"
  AND student."classId" IS NOT NULL
  AND enrollment."classId" <> student."classId";

-- CreateIndex
CREATE INDEX "StudentEnrollment_schoolId_academicSessionId_classId_idx"
ON "StudentEnrollment"("schoolId", "academicSessionId", "classId");

-- CreateIndex
CREATE INDEX "StudentEnrollment_studentId_idx" ON "StudentEnrollment"("studentId");

-- AddForeignKey
ALTER TABLE "StudentEnrollment" ADD CONSTRAINT "StudentEnrollment_schoolId_fkey"
FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentEnrollment" ADD CONSTRAINT "StudentEnrollment_studentId_fkey"
FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentEnrollment" ADD CONSTRAINT "StudentEnrollment_academicSessionId_fkey"
FOREIGN KEY ("academicSessionId") REFERENCES "AcademicSession"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentEnrollment" ADD CONSTRAINT "StudentEnrollment_classId_fkey"
FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentEnrollment" ADD CONSTRAINT "StudentEnrollment_promotedToClassId_fkey"
FOREIGN KEY ("promotedToClassId") REFERENCES "Class"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
