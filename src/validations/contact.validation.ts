import { z } from "zod";

export const contactQuerySchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(150),
  email: z.string().trim().email("Invalid email address").max(200),
  phone: z.string().trim().max(30).optional().default(""),
  schoolName: z.string().trim().min(2, "School or institution name must be at least 2 characters").max(200),
  message: z.string().trim().max(5000).optional().default(""),
  // Keep this field hidden and empty in the form. Bots commonly fill it.
  website: z.string().max(200).optional().default(""),
});

export type ContactQuery = z.infer<typeof contactQuerySchema>;
