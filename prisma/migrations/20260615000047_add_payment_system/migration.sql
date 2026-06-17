-- AlterTable
ALTER TABLE "School" ADD COLUMN     "paystackCustomerCode" VARCHAR(150),
ADD COLUMN     "paystackEmailToken" VARCHAR(150),
ADD COLUMN     "paystackSubscriptionCode" VARCHAR(150),
ADD COLUMN     "planId" UUID,
ADD COLUMN     "subscriptionEndedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "suspendedBySubscription" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Teacher" ADD COLUMN     "suspendedBySubscription" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "PaymentPlan" (
    "id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "maxTeachers" INTEGER NOT NULL,
    "maxStudents" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "paystackPlanCode" VARCHAR(150),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "PaymentPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentPlan_name_key" ON "PaymentPlan"("name");

-- AddForeignKey
ALTER TABLE "School" ADD CONSTRAINT "School_planId_fkey" FOREIGN KEY ("planId") REFERENCES "PaymentPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
