import { z } from "zod";

export const recordAttendanceSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  records: z.array(
    z.object({
      studentId: z.string().uuid("Invalid student ID"),
      status: z.enum(["Present", "Absent", "Late"]),
      remarks: z.string().max(200).optional().default(""),
    })
  ).min(1, "At least one attendance record is required"),
});

export const scanAttendanceSchema = z.object({
  admissionNumber: z.string().min(1, "Admission number is required"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  status: z.enum(["Present", "Absent", "Late"]).optional().default("Present"),
  remarks: z.string().max(200).optional().default("Scanned QR Code"),
});

