-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'AttendanceOfficer';

-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN     "takenByUserId" UUID;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_takenByUserId_fkey" FOREIGN KEY ("takenByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

