-- AlterEnum
ALTER TYPE "AnnouncementAudience" ADD VALUE 'SpecificUser';

-- AlterTable
ALTER TABLE "Announcement" ADD COLUMN     "targetUserId" UUID;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
