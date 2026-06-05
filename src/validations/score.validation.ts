import { z } from "zod";

export const enterScoreSchema = z.object({
  studentId: z.string().uuid("Invalid student ID"),
  subjectId: z.string().uuid("Invalid subject ID"),
  classId: z.string().uuid("Invalid class ID"),
  termId: z.string().uuid("Invalid term ID"),
  academicSessionId: z.string().uuid("Invalid academic session ID"),
  firstCA: z.number().min(0).max(20),
  secondCA: z.number().min(0).max(20),
  exam: z.number().min(0).max(60),
  remark: z.string().max(200).optional().default(""),
});

export const bulkScoreEntrySchema = z.object({
  studentId: z.string().uuid("Invalid student ID"),
  firstCA: z.number().min(0).max(20),
  secondCA: z.number().min(0).max(20),
  exam: z.number().min(0).max(60),
  remark: z.string().max(200).optional().default(""),
});

export const bulkEnterScoresSchema = z.object({
  subjectId: z.string().uuid("Invalid subject ID"),
  classId: z.string().uuid("Invalid class ID"),
  termId: z.string().uuid("Invalid term ID"),
  academicSessionId: z.string().uuid("Invalid academic session ID"),
  scores: z.array(bulkScoreEntrySchema),
});
