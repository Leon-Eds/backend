import { z } from "zod";

export const recordFeePaymentSchema = z.object({
  studentId: z.string().uuid("Invalid student ID"),
  termId: z.string().uuid("Invalid term ID"),
  academicSessionId: z.string().uuid("Invalid academic session ID"),
  amountDue: z.number().min(0),
  amountPaid: z.number().min(0),
});
