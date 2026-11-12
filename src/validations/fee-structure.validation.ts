import { z } from "zod";

const feeStructureFields = {
  name: z.string().trim().min(1, "Fee name is required").max(200),
  amount: z.number().positive("Amount must be greater than zero").max(9999999999.99),
  type: z.enum(["base", "custom"]),
  applicableLevels: z.array(z.string().trim().min(1).max(100)).max(100),
};

export const createFeeStructureSchema = z.object({
  ...feeStructureFields,
  applicableLevels: feeStructureFields.applicableLevels.optional().default([]),
});

export const updateFeeStructureSchema = z.object(feeStructureFields).partial();

export const setStudentCustomFeesSchema = z.object({
  feeStructureIds: z.array(z.string().uuid("Invalid fee structure ID")).max(100),
});
