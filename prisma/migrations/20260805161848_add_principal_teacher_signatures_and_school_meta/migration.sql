-- AlterTable
ALTER TABLE "School" ADD COLUMN     "motto" VARCHAR(250) DEFAULT '',
ADD COLUMN     "principalName" VARCHAR(200) DEFAULT '',
ADD COLUMN     "principalSignatureUrl" VARCHAR(500) DEFAULT '',
ADD COLUMN     "website" VARCHAR(250) DEFAULT '';

-- AlterTable
ALTER TABLE "Teacher" ADD COLUMN     "signatureUrl" VARCHAR(500) DEFAULT '';
