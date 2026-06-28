-- CreateEnum
CREATE TYPE "SubscriptionPaymentSource" AS ENUM ('Paystack', 'Manual');

-- AlterTable
ALTER TABLE "School" ADD COLUMN "schoolTheme" JSONB;

-- CreateTable
CREATE TABLE "SubscriptionPaymentLog" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "schoolId" UUID NOT NULL,
    "planId" UUID NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "source" "SubscriptionPaymentSource" NOT NULL,
    "reference" VARCHAR(200),
    "durationDays" INTEGER NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscriptionPaymentLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SubscriptionPaymentLog_schoolId_idx" ON "SubscriptionPaymentLog"("schoolId");

-- CreateIndex
CREATE INDEX "SubscriptionPaymentLog_planId_idx" ON "SubscriptionPaymentLog"("planId");

-- CreateIndex
CREATE INDEX "SubscriptionPaymentLog_paidAt_idx" ON "SubscriptionPaymentLog"("paidAt");

-- AddForeignKey
ALTER TABLE "SubscriptionPaymentLog" ADD CONSTRAINT "SubscriptionPaymentLog_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionPaymentLog" ADD CONSTRAINT "SubscriptionPaymentLog_planId_fkey" FOREIGN KEY ("planId") REFERENCES "PaymentPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
