import { prisma } from "../config/db";
import { hashPassword, verifyPassword } from "../utils/bcrypt";
import { generateJwtToken, generateRefreshToken, getTokenExpiryDate } from "../utils/jwt";
import { generateSlug } from "../utils/slug";
import { successResponse, failResponse } from "../utils/response";
import crypto from "crypto";

export class AuthService {
  private static generateAuthResponseData(user: any, schoolName?: string | null) {
    const token = generateJwtToken(user);
    const refreshToken = generateRefreshToken();
    const tokenExpiry = getTokenExpiryDate();

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

  static async createSuperAdmin(request: any) {
    const configuredSecret = process.env.SUPER_ADMIN_SECRET;
    if (!configuredSecret || request.secretKey !== configuredSecret) {
      return failResponse("Invalid secret key.");
    }

    const existingSuperAdmin = await prisma.user.findFirst({
      where: { role: "SuperAdmin" },
    });

    // if (existingSuperAdmin) {
    //   return failResponse("A Super Admin already exists.");
    // }

    const existingEmail = await prisma.user.findFirst({
      where: { email: request.email.toLowerCase() },
    });

    if (existingEmail) {
      return failResponse("Email already in use.");
    }

    const hashedPassword = await hashPassword(request.password);

    const user = await prisma.user.create({
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
    await prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken: responseData.refreshToken,
        refreshTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return successResponse(responseData, "Super Admin created successfully.");
  }

  static async registerSchool(request: any) {
    const existingEmail = await prisma.user.findFirst({
      where: { email: request.email.toLowerCase() },
    });

    if (existingEmail) {
      return failResponse("Email already in use.");
    }

    let slug = generateSlug(request.schoolName);
    const slugExists = await prisma.school.findFirst({
      where: { slug },
    });

    if (slugExists) {
      slug = `${slug}-${crypto.randomBytes(3).toString("hex")}`;
    }

    const school = await prisma.school.create({
      data: {
        name: request.schoolName,
        address: request.address || "",
        contactEmail: request.email.toLowerCase(),
        contactPhone: request.phone || "",
        slug,
        subscriptionPlan: request.subscriptionPlan || "Free",
        subscriptionStatus: "Active",
        isActive: true,
        schoolType: request.schoolType || null,
        city: request.city || null,
        state: request.state || null,
        country: request.country || null,
        studentCount: request.studentCount !== undefined ? request.studentCount : null,
      },
    });

    const hashedPassword = await hashPassword(request.password);

    const user = await prisma.user.create({
      data: {
        schoolId: school.id,
        name: request.adminName,
        email: request.email.toLowerCase(),
        passwordHash: hashedPassword,
        role: "SchoolAdmin",
        isActive: true,
        adminRole: request.adminRole || null,
      },
    });

    const responseData = this.generateAuthResponseData(user, school.name);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken: responseData.refreshToken,
        refreshTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return successResponse(responseData, "School registered successfully.");
  }

  static async login(request: any) {
    const user = await prisma.user.findFirst({
      where: { email: request.email.toLowerCase() },
      include: { school: true },
    });

    if (!user || !(await verifyPassword(request.password, user.passwordHash))) {
      return failResponse("Invalid email or password.");
    }

    if (!user.isActive) {
      return failResponse("Your account has been deactivated. Contact your administrator.");
    }

    if (user.role !== "SuperAdmin" && user.school) {
      if (!user.school.isActive) {
        return failResponse("Your school account has been suspended. Contact LeonEd Africa support.");
      }
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const responseData = this.generateAuthResponseData(user, user.school?.name);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken: responseData.refreshToken,
        refreshTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return successResponse(responseData, "Login successful.");
  }

  static async refreshToken(request: any) {
    const user = await prisma.user.findFirst({
      where: { refreshToken: request.refreshToken },
      include: { school: true },
    });

    if (!user || !user.refreshTokenExpiry || user.refreshTokenExpiry < new Date()) {
      return failResponse("Invalid or expired refresh token.");
    }

    const responseData = this.generateAuthResponseData(user, user.school?.name);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken: responseData.refreshToken,
        refreshTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return successResponse(responseData);
  }

  static async changePassword(userId: string, request: any) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return failResponse("User not found.");
    }

    if (!(await verifyPassword(request.currentPassword, user.passwordHash))) {
      return failResponse("Current password is incorrect.");
    }

    const hashedPassword = await hashPassword(request.newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword },
    });

    return successResponse(true, "Password changed successfully.");
  }
}
