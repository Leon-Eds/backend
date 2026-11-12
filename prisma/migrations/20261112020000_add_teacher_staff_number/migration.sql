-- AlterTable
ALTER TABLE "Teacher" ADD COLUMN     "staffNumber" VARCHAR(50);

-- Backfill: number existing teachers per school in the order they joined (STF-0001, STF-0002, ...)
UPDATE "Teacher" AS t
SET "staffNumber" = 'STF-' || LPAD(numbered.rn::text, 4, '0')
FROM (
  SELECT "id", ROW_NUMBER() OVER (PARTITION BY "schoolId" ORDER BY "createdAt", "id") AS rn
  FROM "Teacher"
) AS numbered
WHERE t."id" = numbered."id";

-- CreateIndex
CREATE UNIQUE INDEX "Teacher_schoolId_staffNumber_key" ON "Teacher"("schoolId", "staffNumber");
