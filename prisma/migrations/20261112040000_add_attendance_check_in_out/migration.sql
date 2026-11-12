-- AlterTable
ALTER TABLE "School" ADD COLUMN     "attendanceCheckOutEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN     "checkInAt" TIMESTAMP(3),
ADD COLUMN     "checkOutAt" TIMESTAMP(3);

