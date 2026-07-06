import { z } from "zod";

export const createAnnouncementSchema = z.object({
  title: z.string().max(300).min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  audience: z.enum(["All", "Students", "Teachers", "Class"]).optional().default("All"),
  category: z.enum(["GENERAL", "HEALTH", "EMERGENCY", "REMINDERS", "SUMMONS", "ACADEMIC_NOTICE"]).optional().default("GENERAL"),
  targetClassId: z.string().uuid("Invalid class ID").optional().nullable(),
});
