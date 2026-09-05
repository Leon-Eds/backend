import { z } from "zod";

export const recordFeePaymentSchema = z.object({
  studentId: z.string().uuid("Invalid student ID"),
  termId: z.string().uuid("Invalid term ID"),
  academicSessionId: z.string().uuid("Invalid academic session ID"),
  amountDue: z.number().min(0),
  amountPaid: z.number().min(0),
  receiptImageUrl: z.string().url("Invalid receipt image URL").optional().or(z.literal("")),
  description: z.string().max(500, "Description must be under 500 characters").optional().or(z.literal("")),
  paymentMethod: z.string().trim().min(1).max(50).optional(),
  reference: z.string().trim().min(1).max(200).optional(),
});

export const uploadReceiptSchema = z.object({
  termId: z.string().uuid("Invalid term ID"),
  academicSessionId: z.string().uuid("Invalid academic session ID"),
  amountPaid: z.number().min(0),
  receiptImageUrl: z.string().url("Invalid receipt image URL"),
  description: z.string().max(500, "Description must be under 500 characters").optional().or(z.literal("")),
});
