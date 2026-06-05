"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePasswordSchema = exports.refreshTokenSchema = exports.createSuperAdminSchema = exports.registerSchoolSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email address"),
    password: zod_1.z.string().min(6, "Password must be at least 6 characters long"),
});
exports.registerSchoolSchema = zod_1.z.object({
    schoolName: zod_1.z.string().max(200).min(1, "School name is required"),
    adminName: zod_1.z.string().max(150).min(1, "Admin name is required"),
    email: zod_1.z.string().email("Invalid email address"),
    password: zod_1.z.string().min(6, "Password must be at least 6 characters long"),
    phone: zod_1.z.string().max(30).optional().default(""),
    address: zod_1.z.string().max(500).optional().default(""),
    subscriptionPlan: zod_1.z.enum(["Free", "Plus", "Premium"]).optional().default("Free"),
});
exports.createSuperAdminSchema = zod_1.z.object({
    name: zod_1.z.string().max(150).min(1, "Name is required"),
    email: zod_1.z.string().email("Invalid email address"),
    password: zod_1.z.string().min(8, "Password must be at least 8 characters long"),
    secretKey: zod_1.z.string().min(1, "Secret key is required"),
});
exports.refreshTokenSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1, "Refresh token is required"),
});
exports.changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1, "Current password is required"),
    newPassword: zod_1.z.string().min(6, "New password must be at least 6 characters long"),
});
