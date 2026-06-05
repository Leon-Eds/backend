"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordFeePaymentSchema = void 0;
const zod_1 = require("zod");
exports.recordFeePaymentSchema = zod_1.z.object({
    studentId: zod_1.z.string().uuid("Invalid student ID"),
    termId: zod_1.z.string().uuid("Invalid term ID"),
    academicSessionId: zod_1.z.string().uuid("Invalid academic session ID"),
    amountDue: zod_1.z.number().min(0),
    amountPaid: zod_1.z.number().min(0),
});
