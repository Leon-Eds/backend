import { z } from "zod";

export const submitResultSchema = z.object({
  remarks: z.array(
    z.object({
      studentId: z.string().uuid("Invalid student ID"),
      comment: z.string().max(500).optional().default(""),
    })
  ).optional().default([]),
});

export const approveResultSchema = z.object({
  approve: z.boolean().default(true),
  adminComment: z.string().max(500).optional().default(""),
});
