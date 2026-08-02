-- AlterTable
ALTER TABLE "Result" ADD COLUMN     "affectiveDomains" JSONB,
ADD COLUMN     "daysPresent" INTEGER,
ADD COLUMN     "daysSchoolOpened" INTEGER,
ADD COLUMN     "nextTermBegins" DATE,
ADD COLUMN     "promotedTo" VARCHAR(100),
ADD COLUMN     "psychomotorDomains" JSONB;

-- AlterTable
ALTER TABLE "Term" ADD COLUMN     "daysSchoolOpened" INTEGER,
ADD COLUMN     "nextTermBegins" DATE;
