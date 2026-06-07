-- AlterTable
ALTER TABLE "School" ADD COLUMN     "city" VARCHAR(100),
ADD COLUMN     "country" VARCHAR(100),
ADD COLUMN     "schoolType" VARCHAR(100),
ADD COLUMN     "state" VARCHAR(100),
ADD COLUMN     "studentCount" INTEGER;

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "arm" VARCHAR(50),
ADD COLUMN     "bloodGroup" VARCHAR(20);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "adminRole" VARCHAR(100);
