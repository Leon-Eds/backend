"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStudentSchema = exports.createStudentSchema = void 0;
const zod_1 = require("zod");
exports.createStudentSchema = zod_1.z.object({
    fullName: zod_1.z.string().max(200).min(1, "Full name is required"),
    admissionNumber: zod_1.z.string().max(50).optional().nullable(),
    gender: zod_1.z.enum(["Male", "Female"]),
    dateOfBirth: zod_1.z.string().datetime().optional().nullable().or(zod_1.z.date().optional().nullable()).or(zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable()),
    classId: zod_1.z.string().uuid().optional().nullable(),
    parentName: zod_1.z.string().max(200).optional().default(""),
    parentPhone: zod_1.z.string().max(30).optional().default(""),
    parentEmail: zod_1.z.string().max(200).optional().default(""),
});
exports.updateStudentSchema = zod_1.z.object({
    fullName: zod_1.z.string().max(200).optional(),
    gender: zod_1.z.enum(["Male", "Female"]).optional(),
    dateOfBirth: zod_1.z.string().datetime().optional().nullable().or(zod_1.z.date().optional().nullable()).or(zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable()),
    classId: zod_1.z.string().uuid().optional().nullable(),
    parentName: zod_1.z.string().max(200).optional(),
    parentPhone: zod_1.z.string().max(30).optional(),
    parentEmail: zod_1.z.string().max(200).optional(),
    status: zod_1.z.enum(["Active", "Graduated", "Archived", "Suspended"]).optional(),
});
