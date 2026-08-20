-- CreateEnum
CREATE TYPE "SchemeOfWorkStatus" AS ENUM ('Draft', 'Submitted', 'Approved', 'Rejected');

-- AlterTable
ALTER TABLE "SchemeOfWork" 
ADD COLUMN IF NOT EXISTS "status" "SchemeOfWorkStatus" NOT NULL DEFAULT 'Submitted',
ADD COLUMN IF NOT EXISTS "rejectionReason" VARCHAR(500) DEFAULT '',
ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "approvedByUserId" UUID;
