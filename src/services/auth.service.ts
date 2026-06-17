import { prisma } from "../config/db";
import { hashPassword, verifyPassword } from "../utils/bcrypt";
import { generateJwtToken, generateRefreshToken, getTokenExpiryDate } from "../utils/jwt";
import { generateSlug } from "../utils/slug";
import { successResponse, failResponse } from "../utils/response";
import crypto from "crypto";
import { emailService } from "../utils/email";

export class AuthService {
  private static generateAuthResponseData(user: any, schoolName?: string | null, schoolLogoUrl?: string | null) {
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
        profilePictureUrl: user.profilePictureUrl || "",
        schoolLogoUrl: schoolLogoUrl || "",
        isVerified: user.isVerified || false,
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
        isVerified: true,
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

    // Send welcome email immediately
    emailService.sendSuperAdminWelcomeEmail(user.email, user.name)
      .catch((err) => console.error("[AuthService] Super admin welcome email error:", err));

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

    let freePlan = await prisma.paymentPlan.findUnique({
      where: { name: "Free" },
    });

    if (!freePlan) {
      freePlan = await prisma.paymentPlan.create({
        data: {
          name: "Free",
          amount: 0,
          maxTeachers: 20,
          maxStudents: 100,
        },
      });
    }

    const school = await prisma.school.create({
      data: {
        name: request.schoolName,
        address: request.address || "",
        contactEmail: request.email.toLowerCase(),
        contactPhone: request.phone || "",
        slug,
        planId: freePlan.id,
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
        isVerified: true,
      },
    });

    const responseData = this.generateAuthResponseData(user, school.name, school.logoUrl);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken: responseData.refreshToken,
        refreshTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    emailService.sendSchoolWelcomeEmail(
      user.email,
      user.name,
      school.name,
      school.slug,
      "Free"
    ).catch((err) => console.error("[AuthService] School welcome email error:", err));

    return successResponse(responseData, "School registered successfully.");
  }

  static async login(request: any) {
    const input = (request.email || "").trim().toLowerCase();
    const isEmail = input.includes("@");

    let user = null;

    if (isEmail) {
      user = await prisma.user.findFirst({
        where: { email: input },
        include: { school: true },
      });
    } else {
      // Find the student with this admission number
      const student = await prisma.student.findFirst({
        where: { admissionNumber: { equals: input, mode: "insensitive" } },
        include: {
          user: {
            include: { school: true },
          },
        },
      });
      if (student && student.user) {
        user = {
          ...student.user,
          school: student.user.school,
        } as any;
      }
    }

    if (!user || !(await verifyPassword(request.password, user.passwordHash))) {
      return failResponse("Invalid email/admission number or password.");
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

    const responseData = this.generateAuthResponseData(user, user.school?.name, user.school?.logoUrl);

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

    const responseData = this.generateAuthResponseData(user, user.school?.name, user.school?.logoUrl);

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

  static async forgotPassword(request: any) {
    const user = await prisma.user.findFirst({
      where: { email: request.email.toLowerCase() },
    });

    // Always return success to prevent email enumeration attacks
    if (!user) {
      return successResponse(true, "If an account with that email exists, a password reset link has been sent.");
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpiry: resetExpiry,
      },
    });

    // Send reset password email asynchronously
    emailService.sendPasswordResetEmail(user.email, user.name, resetToken)
      .catch((err) => console.error("[AuthService] Password reset email error:", err));

    // In production, send email with reset link containing the token.
    // For now, return the token directly for development/testing.
    return successResponse(
      { resetToken, expiresAt: resetExpiry },
      "If an account with that email exists, a password reset link has been sent."
    );
  }

  static async resetPassword(request: any) {
    const user = await prisma.user.findFirst({
      where: { passwordResetToken: request.token },
    });

    if (!user) {
      return failResponse("Invalid or expired reset token.");
    }

    if (!user.passwordResetExpiry || user.passwordResetExpiry < new Date()) {
      return failResponse("Reset token has expired. Please request a new one.");
    }

    const hashedPassword = await hashPassword(request.newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        passwordResetToken: null,
        passwordResetExpiry: null,
      },
    });

    return successResponse(true, "Password reset successfully. You can now log in with your new password.");
  }

  static async verifyOtp(request: any) {
    const user = await prisma.user.findUnique({
      where: { email: request.email.toLowerCase().trim() },
      include: { school: { include: { plan: true } } },
    });

    if (!user) {
      return failResponse("User not found.");
    }

    if (user.isVerified) {
      return failResponse("Email is already verified.");
    }

    if (!user.verificationOtp || user.verificationOtp !== request.otp) {
      return failResponse("Invalid verification OTP.");
    }

    if (!user.verificationOtpExpiry || user.verificationOtpExpiry < new Date()) {
      return failResponse("Verification OTP has expired. Please request a new one.");
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationOtp: null,
        verificationOtpExpiry: null,
      },
    });

    // Send corresponding welcome email upon verification
    if (updatedUser.role === "SchoolAdmin" && user.school) {
      emailService.sendSchoolWelcomeEmail(
        updatedUser.email,
        updatedUser.name,
        user.school.name,
        user.school.slug,
        user.school.plan?.name || "Free"
      ).catch((err) => console.error("[AuthService] Welcome email error:", err));
    } else if (updatedUser.role === "SuperAdmin") {
      emailService.sendSuperAdminWelcomeEmail(updatedUser.email, updatedUser.name)
        .catch((err) => console.error("[AuthService] Super admin welcome email error:", err));
    }

    const responseData = this.generateAuthResponseData(updatedUser, user.school?.name, user.school?.logoUrl);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken: responseData.refreshToken,
        refreshTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return successResponse(responseData, "Email verified successfully.");
  }

  static async resendOtp(request: any) {
    const user = await prisma.user.findUnique({
      where: { email: request.email.toLowerCase().trim() },
    });

    if (!user) {
      return failResponse("User not found.");
    }

    if (user.isVerified) {
      return failResponse("Email is already verified.");
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationOtp: otp,
        verificationOtpExpiry: otpExpiry,
      },
    });

    emailService.sendVerificationOtpEmail(user.email, user.name, otp)
      .catch((err) => console.error("[AuthService] Resend OTP email error:", err));

    return successResponse(true, "A new verification OTP has been sent to your email.");
  }
}
