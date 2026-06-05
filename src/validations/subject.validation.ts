import { z } from "zod";

export const createSubjectSchema = z.object({
  name: z.string().max(150).min(1, "Name is required"),
});

export const updateSubjectSchema = z.object({
  name: z.string().max(150).min(1, "Name is required"),
});
