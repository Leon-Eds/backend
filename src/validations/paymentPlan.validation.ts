import { z } from "zod";

export const createPaymentPlanSchema = z.object({
  name: z.string().min(1, "Plan name is required").max(150),
  amount: z.number().nonnegative("Amount must be a non-negative number"),
  maxTeachers: z.number().int().positive("Max teachers must be a positive integer"),
  maxStudents: z.number().int().positive("Max students must be a positive integer"),
});

export const updatePaymentPlanSchema = z.object({
  name: z.string().min(1, "Plan name is required").max(150).optional(),
  amount: z.number().nonnegative("Amount must be a non-negative number").optional(),
  maxTeachers: z.number().int().positive("Max teachers must be a positive integer").optional(),
  maxStudents: z.number().int().positive("Max students must be a positive integer").optional(),
  isActive: z.boolean().optional(),
});
