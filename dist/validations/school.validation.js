"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSchoolPlanSchema = exports.updateSchoolSchema = void 0;
const zod_1 = require("zod");
exports.updateSchoolSchema = zod_1.z.object({
    name: zod_1.z.string().max(200).optional(),
    address: zod_1.z.string().max(500).optional(),
    contactEmail: zod_1.z.string().email("Invalid email address").optional(),
    contactPhone: zod_1.z.string().max(30).optional(),
    logoUrl: zod_1.z.string().max(500).optional(),
});
exports.updateSchoolPlanSchema = zod_1.z.object({
    subscriptionPlan: zod_1.z.enum(["Free", "Plus", "Premium"]),
});
