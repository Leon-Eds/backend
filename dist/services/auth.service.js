"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const db_1 = require("../config/db");
const bcrypt_1 = require("../utils/bcrypt");
const jwt_1 = require("../utils/jwt");
const slug_1 = require("../utils/slug");
const response_1 = require("../utils/response");
const crypto_1 = __importDefault(require("crypto"));
class AuthService {
    static generateAuthResponseData(user, schoolName) {
        const token = (0, jwt_1.generateJwtToken)(user);
        const refreshToken = (0, jwt_1.generateRefreshToken)();
        const tokenExpiry = (0, jwt_1.getTokenExpiryDate)();
        return {
            token,
            refreshToken,
            tokenExpiry,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                schoolId: user.schoolId,
                schoolName: schoolName || null,
            },
        };
    }
    static async createSuperAdmin(request) {
        const configuredSecret = process.env.SUPER_ADMIN_SECRET;
        if (!configuredSecret || request.secretKey !== configuredSecret) {
            return (0, response_1.failResponse)("Invalid secret key.");
        }
        const existingSuperAdmin = await db_1.prisma.user.findFirst({
            where: { role: "SuperAdmin" },
        });
        if (existingSuperAdmin) {
            return (0, response_1.failResponse)("A Super Admin already exists.");
        }
        const existingEmail = await db_1.prisma.user.findFirst({
            where: { email: request.email.toLowerCase() },
        });
        if (existingEmail) {
            return (0, response_1.failResponse)("Email already in use.");
        }
        const hashedPassword = await (0, bcrypt_1.hashPassword)(request.password);
        const user = await db_1.prisma.user.create({
            data: {
                name: request.name,
                email: request.email.toLowerCase(),
                passwordHash: hashedPassword,
                role: "SuperAdmin",
                isActive: true,
            },
        });
        const responseData = this.generateAuthResponseData(user, null);
        // Save refresh token to user
        await db_1.prisma.user.update({
            where: { id: user.id },
            data: {
                refreshToken: responseData.refreshToken,
                refreshTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            },
        });
        return (0, response_1.successResponse)(responseData, "Super Admin created successfully.");
    }
    static async registerSchool(request) {
        const existingEmail = await db_1.prisma.user.findFirst({
            where: { email: request.email.toLowerCase() },
        });
        if (existingEmail) {
            return (0, response_1.failResponse)("Email already in use.");
        }
        let slug = (0, slug_1.generateSlug)(request.schoolName);
        const slugExists = await db_1.prisma.school.findFirst({
            where: { slug },
        });
        if (slugExists) {
            slug = `${slug}-${crypto_1.default.randomBytes(3).toString("hex")}`;
        }
        const school = await db_1.prisma.school.create({
            data: {
                name: request.schoolName,
                address: request.address || "",
                contactEmail: request.email.toLowerCase(),
                contactPhone: request.phone || "",
                slug,
                subscriptionPlan: request.subscriptionPlan || "Free",
                subscriptionStatus: "Active",
                isActive: true,
            },
        });
        const hashedPassword = await (0, bcrypt_1.hashPassword)(request.password);
        const user = await db_1.prisma.user.create({
            data: {
                schoolId: school.id,
                name: request.adminName,
                email: request.email.toLowerCase(),
                passwordHash: hashedPassword,
                role: "SchoolAdmin",
                isActive: true,
            },
        });
        const responseData = this.generateAuthResponseData(user, school.name);
        await db_1.prisma.user.update({
            where: { id: user.id },
            data: {
                refreshToken: responseData.refreshToken,
                refreshTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            },
        });
        return (0, response_1.successResponse)(responseData, "School registered successfully.");
    }
    static async login(request) {
        const user = await db_1.prisma.user.findFirst({
            where: { email: request.email.toLowerCase() },
            include: { school: true },
        });
        if (!user || !(await (0, bcrypt_1.verifyPassword)(request.password, user.passwordHash))) {
            return (0, response_1.failResponse)("Invalid email or password.");
        }
        if (!user.isActive) {
            return (0, response_1.failResponse)("Your account has been deactivated. Contact your administrator.");
        }
        if (user.role !== "SuperAdmin" && user.school) {
            if (!user.school.isActive) {
                return (0, response_1.failResponse)("Your school account has been suspended. Contact LeonEd Africa support.");
            }
        }
        await db_1.prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
        });
        const responseData = this.generateAuthResponseData(user, user.school?.name);
        await db_1.prisma.user.update({
            where: { id: user.id },
            data: {
                refreshToken: responseData.refreshToken,
                refreshTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            },
        });
        return (0, response_1.successResponse)(responseData, "Login successful.");
    }
    static async refreshToken(request) {
        const user = await db_1.prisma.user.findFirst({
            where: { refreshToken: request.refreshToken },
            include: { school: true },
        });
        if (!user || !user.refreshTokenExpiry || user.refreshTokenExpiry < new Date()) {
            return (0, response_1.failResponse)("Invalid or expired refresh token.");
        }
        const responseData = this.generateAuthResponseData(user, user.school?.name);
        await db_1.prisma.user.update({
            where: { id: user.id },
            data: {
                refreshToken: responseData.refreshToken,
                refreshTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });
        return (0, response_1.successResponse)(responseData);
    }
    static async changePassword(userId, request) {
        const user = await db_1.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            return (0, response_1.failResponse)("User not found.");
        }
        if (!(await (0, bcrypt_1.verifyPassword)(request.currentPassword, user.passwordHash))) {
            return (0, response_1.failResponse)("Current password is incorrect.");
        }
        const hashedPassword = await (0, bcrypt_1.hashPassword)(request.newPassword);
        await db_1.prisma.user.update({
            where: { id: userId },
            data: { passwordHash: hashedPassword },
        });
        return (0, response_1.successResponse)(true, "Password changed successfully.");
    }
}
exports.AuthService = AuthService;
