CREATE TABLE "FeePaymentTransaction" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "feePaymentId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "termId" UUID NOT NULL,
    "academicSessionId" UUID NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "method" VARCHAR(50) NOT NULL DEFAULT 'Manual',
    "reference" VARCHAR(200),
    "description" VARCHAR(500) NOT NULL DEFAULT '',
    "recordedByUserId" UUID,
    "reversalOfId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FeePaymentTransaction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FeePaymentTransaction_schoolId_reference_key" ON "FeePaymentTransaction"("schoolId", "reference");
CREATE INDEX "FeePaymentTransaction_schoolId_createdAt_idx" ON "FeePaymentTransaction"("schoolId", "createdAt");
CREATE INDEX "FeePaymentTransaction_studentId_termId_idx" ON "FeePaymentTransaction"("studentId", "termId");

ALTER TABLE "FeePaymentTransaction" ADD CONSTRAINT "FeePaymentTransaction_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FeePaymentTransaction" ADD CONSTRAINT "FeePaymentTransaction_feePaymentId_fkey" FOREIGN KEY ("feePaymentId") REFERENCES "FeePayment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FeePaymentTransaction" ADD CONSTRAINT "FeePaymentTransaction_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FeePaymentTransaction" ADD CONSTRAINT "FeePaymentTransaction_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE "FeePaymentTransaction" ADD CONSTRAINT "FeePaymentTransaction_academicSessionId_fkey" FOREIGN KEY ("academicSessionId") REFERENCES "AcademicSession"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE "FeePaymentTransaction" ADD CONSTRAINT "FeePaymentTransaction_recordedByUserId_fkey" FOREIGN KEY ("recordedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FeePaymentTransaction" ADD CONSTRAINT "FeePaymentTransaction_reversalOfId_fkey" FOREIGN KEY ("reversalOfId") REFERENCES "FeePaymentTransaction"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
