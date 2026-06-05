import { z } from "zod";

export const submitResultSchema = z.object({
  teacherComment: z.string().max(500).optional().default(""),
});

export const approveResultSchema = z.object({
  approve: z.boolean().default(true),
  adminComment: z.string().max(500).optional().default(""),
});
