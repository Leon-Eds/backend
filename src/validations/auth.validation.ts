import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Email or admission number is required"),
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
  schoolType: z.string().max(100).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  studentCount: z.preprocess((val) => (val === "" || val === undefined ? undefined : Number(val)), z.number().int().nonnegative().optional().nullable()),
  adminRole: z.string().max(100).optional().nullable(),
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

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters long"),
});

export const verifyOtpSchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z.string().min(4, "OTP must be at least 4 characters").max(10, "OTP cannot exceed 10 characters"),
});

export const resendOtpSchema = z.object({
  email: z.string().email("Invalid email address"),
});
