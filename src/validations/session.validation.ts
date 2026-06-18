import { z } from "zod";

export const createSessionSchema = z.object({
  name: z.string().max(50).min(1, "Name is required"),
  startDate: z.string().datetime().or(z.date()).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  endDate: z.string().datetime().or(z.date()).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
});

export const createTermSchema = z.object({
  termNumber: z.enum(["First", "Second", "Third"]),
  startDate: z.string().datetime().or(z.date()).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  endDate: z.string().datetime().or(z.date()).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
});

export const updateSessionSchema = z.object({
  name: z.string().max(50).min(1).optional(),
  startDate: z.string().datetime().or(z.date()).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  endDate: z.string().datetime().or(z.date()).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
});

export const updateTermSchema = z.object({
  termNumber: z.enum(["First", "Second", "Third"]).optional(),
  startDate: z.string().datetime().or(z.date()).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  endDate: z.string().datetime().or(z.date()).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
});
