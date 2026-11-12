-- Catch-up for schema changes that reached existing databases without a migration.
-- Every statement is skipped when the object already exists, so this is a no-op on
-- databases that already have them and makes databases built from migrations complete.

-- StudentStatus 'Left'
ALTER TYPE "StudentStatus" ADD VALUE IF NOT EXISTS 'Left';

-- Announcement categories
DO $$
BEGIN
    CREATE TYPE "AnnouncementCategory" AS ENUM ('GENERAL', 'HEALTH', 'EMERGENCY', 'REMINDERS', 'SUMMONS', 'ACADEMIC_NOTICE');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Announcement" ADD COLUMN IF NOT EXISTS "category" "AnnouncementCategory" NOT NULL DEFAULT 'GENERAL';

-- Result class average
ALTER TABLE "Result" ADD COLUMN IF NOT EXISTS "classAverage" DECIMAL(6,2) NOT NULL DEFAULT 0;

-- Score locking and subject position
ALTER TABLE "Score" ADD COLUMN IF NOT EXISTS "isLocked" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Score" ADD COLUMN IF NOT EXISTS "subjectPosition" INTEGER NOT NULL DEFAULT 0;
