import { z } from "zod";

export const createAnnouncementSchema = z.object({
  title: z.string().max(300).min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  audience: z.enum(["All", "Students", "Teachers", "Class"]).optional().default("All"),
  targetClassId: z.string().uuid("Invalid class ID").optional().nullable(),
});
