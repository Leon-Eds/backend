-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verificationOtp" VARCHAR(10),
ADD COLUMN     "verificationOtpExpiry" TIMESTAMP(3);
