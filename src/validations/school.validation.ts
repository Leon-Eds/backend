import { z } from "zod";

export const updateSchoolSchema = z.object({
  name: z.string().max(200).optional(),
  address: z.string().max(500).optional(),
  contactEmail: z.string().email("Invalid email address").optional(),
  contactPhone: z.string().max(30).optional(),
  logoUrl: z.string().max(500).optional(),
  schoolTheme: z.object({
    primaryColor: z.string().max(30).optional(),
    secondaryColor: z.string().max(30).optional(),
    accentColor: z.string().max(30).optional(),
    font: z.string().max(100).optional(),
  }).optional(),
  bankAccountName: z.string().max(200).optional(),
  bankName: z.string().max(150).optional(),
  bankAccountNumber: z.string().max(50).optional(),
});

export const updateSchoolPlanSchema = z.object({
  planId: z.string().uuid("Invalid plan ID format"),
});
