import { z } from "zod";

export const createClassSchema = z.object({
  name: z.string().max(100).min(1, "Name is required"),
  arm: z.string().max(10).optional().default(""),
  academicSessionId: z.string().uuid().optional().nullable(),
  formTeacherId: z.string().uuid().optional().nullable(),
});

export const updateClassSchema = z.object({
  name: z.string().max(100).optional(),
  arm: z.string().max(10).optional(),
  formTeacherId: z.string().uuid().optional().nullable(),
});

export const assignSubjectsToClassSchema = z.object({
  subjectIds: z.array(z.string().uuid("Invalid subject ID")),
});
