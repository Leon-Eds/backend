-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "profilePictureUrl" VARCHAR(500) NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "Teacher" ADD COLUMN     "profilePictureUrl" VARCHAR(500) NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "profilePictureUrl" VARCHAR(500) NOT NULL DEFAULT '';
