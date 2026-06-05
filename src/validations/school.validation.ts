import { z } from "zod";

export const updateSchoolSchema = z.object({
  name: z.string().max(200).optional(),
  address: z.string().max(500).optional(),
  contactEmail: z.string().email("Invalid email address").optional(),
  contactPhone: z.string().max(30).optional(),
  logoUrl: z.string().max(500).optional(),
});

export const updateSchoolPlanSchema = z.object({
  subscriptionPlan: z.enum(["Free", "Plus", "Premium"]),
});
