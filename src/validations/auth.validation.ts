import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

export const registerSchoolSchema = z.object({
  schoolName: z.string().max(200).min(1, "School name is required"),
  adminName: z.string().max(150).min(1, "Admin name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  phone: z.string().max(30).optional().default(""),
  address: z.string().max(500).optional().default(""),
  subscriptionPlan: z.enum(["Free", "Plus", "Premium"]).optional().default("Free"),
});

export const createSuperAdminSchema = z.object({
  name: z.string().max(150).min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  secretKey: z.string().min(1, "Secret key is required"),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters long"),
});
