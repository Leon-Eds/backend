"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTermSchema = exports.createSessionSchema = void 0;
const zod_1 = require("zod");
exports.createSessionSchema = zod_1.z.object({
    name: zod_1.z.string().max(50).min(1, "Name is required"),
    startDate: zod_1.z.string().datetime().or(zod_1.z.date()).or(zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    endDate: zod_1.z.string().datetime().or(zod_1.z.date()).or(zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
});
exports.createTermSchema = zod_1.z.object({
    termNumber: zod_1.z.enum(["First", "Second", "Third"]),
    startDate: zod_1.z.string().datetime().or(zod_1.z.date()).or(zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    endDate: zod_1.z.string().datetime().or(zod_1.z.date()).or(zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
});
