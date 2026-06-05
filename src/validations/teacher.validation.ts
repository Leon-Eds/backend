import { z } from "zod";

export const createTeacherSchema = z.object({
  fullName: z.string().max(200).min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().max(30).optional().default(""),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

export const updateTeacherSchema = z.object({
  fullName: z.string().max(200).optional(),
  phone: z.string().max(30).optional(),
});

export const assignTeacherSchema = z.object({
  subjectId: z.string().uuid("Invalid subject ID"),
  classId: z.string().uuid("Invalid class ID"),
});
