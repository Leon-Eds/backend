/*
  1. Create the Parent table first
  2. Migrate existing parent data from Student into Parent (deduplicated by schoolId + email)
  3. Link students to their migrated parent records
  4. Drop the old flat parent columns from Student
*/

-- CreateTable
CREATE TABLE "Parent" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "fullName" VARCHAR(200) NOT NULL,
    "email" VARCHAR(200) NOT NULL,
    "phone" VARCHAR(30) NOT NULL DEFAULT '',
    "passportUrl" VARCHAR(500) NOT NULL DEFAULT '',
    "idNumber" VARCHAR(100) NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "Parent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Parent_schoolId_idx" ON "Parent"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "Parent_schoolId_email_key" ON "Parent"("schoolId", "email");

-- AddForeignKey
ALTER TABLE "Parent" ADD CONSTRAINT "Parent_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add parentId column to Student (nullable, no FK yet)
ALTER TABLE "Student" ADD COLUMN "parentId" UUID;

-- Migrate existing parent data: insert unique parents from Student records
INSERT INTO "Parent" ("id", "schoolId", "fullName", "email", "phone", "createdAt")
SELECT DISTINCT ON ("schoolId", LOWER(TRIM("parentEmail")))
    gen_random_uuid(),
    "schoolId",
    COALESCE(NULLIF(TRIM("parentName"), ''), ''),
    LOWER(TRIM("parentEmail")),
    COALESCE(NULLIF(TRIM("parentPhone"), ''), ''),
    NOW()
FROM "Student"
WHERE "parentEmail" IS NOT NULL AND TRIM("parentEmail") <> '';

-- Link students to their migrated parent records
UPDATE "Student" s
SET "parentId" = p."id"
FROM "Parent" p
WHERE p."schoolId" = s."schoolId"
  AND p."email" = LOWER(TRIM(s."parentEmail"))
  AND s."parentEmail" IS NOT NULL
  AND TRIM(s."parentEmail") <> '';

-- Now drop the old flat parent columns
ALTER TABLE "Student" DROP COLUMN "parentEmail",
DROP COLUMN "parentName",
DROP COLUMN "parentPhone";

-- AddForeignKey for parentId
ALTER TABLE "Student" ADD CONSTRAINT "Student_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Parent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
