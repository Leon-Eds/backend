import { z } from "zod";

export const createBursarSchema = z.object({
  fullName: z.string().max(200).min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().max(30).optional().default(""),
  profilePictureUrl: z.string().max(500).optional().default(""),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});
