import { z } from "zod";

export const createStudentSchema = z.object({
  fullName: z.string().max(200).min(1, "Full name is required"),
  admissionNumber: z.string().max(50).optional().nullable(),
  gender: z.enum(["Male", "Female"]),
  dateOfBirth: z.string().datetime().optional().nullable().or(z.date().optional().nullable()).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable()),
  classId: z.string().uuid().optional().nullable(),
  profilePictureUrl: z.string().max(500).optional().default(""),
  parentName: z.string().max(200).optional().default(""),
  parentPhone: z.string().max(30).optional().default(""),
  parentEmail: z.string().max(200).optional().default(""),
  parentPassportUrl: z.string().max(500).optional().default(""),
  parentIdNumber: z.string().max(100).optional().default(""),
  password: z.string().min(6, "Password must be at least 6 characters long").optional().nullable(),
  arm: z.string().max(50).optional().nullable(),
  bloodGroup: z.string().max(20).optional().nullable(),
});

export const updateStudentSchema = z.object({
  fullName: z.string().max(200).optional(),
  gender: z.enum(["Male", "Female"]).optional(),
  dateOfBirth: z.string().datetime().optional().nullable().or(z.date().optional().nullable()).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable()),
  classId: z.string().uuid().optional().nullable(),
  profilePictureUrl: z.string().max(500).optional(),
  parentName: z.string().max(200).optional(),
  parentPhone: z.string().max(30).optional(),
  parentEmail: z.string().max(200).optional(),
  parentPassportUrl: z.string().max(500).optional(),
  parentIdNumber: z.string().max(100).optional(),
  status: z.enum(["Active", "Graduated", "Archived", "Suspended", "Left"]).optional(),
  arm: z.string().max(50).optional().nullable(),
  bloodGroup: z.string().max(20).optional().nullable(),
});
