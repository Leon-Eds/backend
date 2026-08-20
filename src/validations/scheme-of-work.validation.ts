import { z } from "zod";

export const topicItemSchema = z.object({
  week: z.number().int().min(1, "Week must be at least 1"),
  topic: z.string().min(1, "Topic title is required"),
  description: z.string().optional().default(""),
});

export const createSchemeOfWorkSchema = z.object({
  classId: z.string().uuid("Invalid class ID"),
  subjectId: z.string().uuid("Invalid subject ID"),
  termId: z.string().uuid("Invalid term ID"),
  topics: z.array(topicItemSchema).min(1, "At least one topic must be provided"),
});

export const updateSchemeOfWorkSchema = z.object({
  topics: z.array(topicItemSchema).min(1, "At least one topic must be provided"),
});

export const reviewSchemeOfWorkSchema = z.object({
  status: z.enum(["Approved", "Rejected"]),
  rejectionReason: z.string().optional().default(""),
});

export const updateTopicProgressSchema = z.object({
  week: z.number().int().min(1, "Week must be at least 1"),
  isCompleted: z.boolean(),
});
