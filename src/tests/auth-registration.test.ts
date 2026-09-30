import test from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../config/db";
import { AuthService } from "../services/auth.service";
import { emailService } from "../utils/email";

test("school registration requires email verification before authentication", async () => {
  const originalUserFindFirst = prisma.user.findFirst;
  const originalUserUpdate = prisma.user.update;
  const originalSchoolFindFirst = prisma.school.findFirst;
  const originalPlanFindUnique = prisma.paymentPlan.findUnique;
  const originalTransaction = prisma.$transaction;
  const originalSendVerificationOtpEmail = emailService.sendVerificationOtpEmail;

  let createdUserData: any;
  let sentOtp: string | undefined;
  let loginUpdateCount = 0;

  try {
    (prisma.user as any).findFirst = async () => null;
    (prisma.school as any).findFirst = async () => null;
    (prisma.paymentPlan as any).findUnique = async () => ({
      id: "plan-id",
      name: "Free",
    });
    (prisma as any).$transaction = async (callback: (tx: any) => Promise<any>) => callback({
      school: {
        create: async ({ data }: any) => ({
          id: "school-id",
          logoUrl: null,
          ...data,
        }),
      },
      user: {
        create: async ({ data }: any) => {
          createdUserData = data;
          return { id: "user-id", profilePictureUrl: "", ...data };
        },
      },
    });
    emailService.sendVerificationOtpEmail = async (_to, _name, otp) => {
      sentOtp = otp;
      return { success: true, data: { id: "email-id" } } as any;
    };

    const beforeRegistration = Date.now();
    const result = await AuthService.registerSchool({
      schoolName: "Test School",
      adminName: "Test Admin",
      email: " ADMIN@EXAMPLE.COM ",
      password: "secret123",
    });

    assert.equal(result.success, true);
    assert.deepEqual(result.data, {
      email: "admin@example.com",
      requiresVerification: true,
    });
    assert.equal(createdUserData.isVerified, false);
    assert.equal(createdUserData.refreshToken, undefined);
    assert.match(createdUserData.verificationOtp, /^\d{6}$/);
    assert.equal(sentOtp, createdUserData.verificationOtp);
    assert.ok(createdUserData.verificationOtpExpiry.getTime() >= beforeRegistration + 15 * 60 * 1000);

    (prisma.user as any).findFirst = async () => ({
      id: "user-id",
      profilePictureUrl: "",
      ...createdUserData,
      school: { id: "school-id", isActive: true, plan: { name: "Free" } },
    });
    (prisma.user as any).update = async () => {
      loginUpdateCount += 1;
    };

    const loginResult = await AuthService.login({
      email: "admin@example.com",
      password: "secret123",
    });

    assert.equal(loginResult.success, false);
    assert.match(loginResult.message, /email verification is required/i);
    assert.equal(loginUpdateCount, 0);
  } finally {
    (prisma.user as any).findFirst = originalUserFindFirst;
    (prisma.user as any).update = originalUserUpdate;
    (prisma.school as any).findFirst = originalSchoolFindFirst;
    (prisma.paymentPlan as any).findUnique = originalPlanFindUnique;
    (prisma as any).$transaction = originalTransaction;
    emailService.sendVerificationOtpEmail = originalSendVerificationOtpEmail;
  }
});
