import { prisma } from "../config/db";
import { successResponse, failResponse } from "../utils/response";
import { paystack } from "../utils/paystack";
import { emailService } from "../utils/email";

export class PaymentService {
  /**
   * Initialize a checkout session with Paystack
   */
  static async initializeCheckout(schoolId: string, planId: string, callbackUrl: string) {
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
    });

    if (!school) {
      return failResponse("School not found.");
    }

    const plan = await prisma.paymentPlan.findUnique({
      where: { id: planId },
    });

    if (!plan || !plan.isActive) {
      return failResponse("Active payment plan not found.");
    }

    if (!plan.paystackPlanCode) {
      return failResponse("Payment plan is not configured with Paystack. Please contact support.");
    }

    try {
      const metadata = { schoolId, planId };
      const paystackTx = await paystack.initializeTransaction(
        school.contactEmail,
        Number(plan.amount),
        plan.paystackPlanCode,
        callbackUrl,
        metadata
      );

      if (paystackTx.success && paystackTx.data) {
        return successResponse({
          authorizationUrl: paystackTx.data.authorization_url,
          reference: paystackTx.data.reference,
        }, "Payment initialized successfully.");
      }

      return failResponse("Failed to initialize payment with Paystack.");
    } catch (error: any) {
      return failResponse(`Payment initialization error: ${error.message}`);
    }
  }

  /**
   * Cancel subscription (Disable auto-renew)
   */
  static async cancelSubscription(schoolId: string) {
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
    });

    if (!school) {
      return failResponse("School not found.");
    }

    if (!school.paystackSubscriptionCode) {
      return failResponse("No active card subscription found for this school.");
    }

    try {
      await paystack.disableSubscription(
        school.paystackSubscriptionCode,
        school.paystackEmailToken || ""
      );

      // Remove the subscription code to prevent further charges,
      // but let the active plan run until subscriptionEndedAt.
      await prisma.school.update({
        where: { id: schoolId },
        data: {
          paystackSubscriptionCode: null,
          paystackEmailToken: null,
        },
      });

      return successResponse(true, "Subscription renewal has been cancelled successfully. Your features remain active until the end of your billing cycle.");
    } catch (error: any) {
      return failResponse(`Failed to cancel subscription: ${error.message}`);
    }
  }

  /**
   * Process Paystack Webhooks
   */
  static async handleWebhook(event: string, data: any) {
    console.log(`[PaymentService] Processing webhook event: ${event}`);

    if (event === "charge.success") {
      const schoolId = data.metadata?.schoolId;
      const planId = data.metadata?.planId;
      const planCode = data.plan?.plan_code;
      const customerEmail = data.customer?.email;
      const customerCode = data.customer?.customer_code;
      const subscriptionCode = data.subscription?.subscription_code;
      const emailToken = data.subscription?.email_token;
      
      // Determine the school
      let school = null;
      if (schoolId) {
        school = await prisma.school.findUnique({ where: { id: schoolId } });
      }
      if (!school && subscriptionCode) {
        school = await prisma.school.findFirst({ where: { paystackSubscriptionCode: subscriptionCode } });
      }
      if (!school && customerCode) {
        school = await prisma.school.findFirst({ where: { paystackCustomerCode: customerCode } });
      }
      if (!school && customerEmail) {
        school = await prisma.school.findFirst({ where: { contactEmail: customerEmail.toLowerCase() } });
      }

      if (!school) {
        console.error(`[PaymentService] School not found for transaction. Email: ${customerEmail}`);
        return;
      }

      // Determine the plan
      let plan = null;
      if (planId) {
        plan = await prisma.paymentPlan.findUnique({ where: { id: planId } });
      }
      if (!plan && planCode) {
        plan = await prisma.paymentPlan.findFirst({ where: { paystackPlanCode: planCode } });
      }

      if (!plan) {
        console.error(`[PaymentService] Plan not found for plan code: ${planCode}`);
        return;
      }

      // Calculate next payment date
      let endedAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // fallback 30 days
      if (data.subscription?.next_payment_date) {
        endedAt = new Date(data.subscription.next_payment_date);
      } else if (data.next_payment_date) {
        endedAt = new Date(data.next_payment_date);
      }

      // Update school subscription status
      await prisma.school.update({
        where: { id: school.id },
        data: {
          planId: plan.id,
          subscriptionStatus: "Active",
          subscriptionEndedAt: endedAt,
          paystackSubscriptionCode: subscriptionCode || school.paystackSubscriptionCode,
          paystackCustomerCode: customerCode || school.paystackCustomerCode,
          paystackEmailToken: emailToken || school.paystackEmailToken,
          isActive: true,
        },
      });

      // Reactivate excess accounts
      await this.reactivateSchoolSuspendedAccounts(school.id, plan.maxTeachers, plan.maxStudents);

      // Send active email
      const schoolAdmin = await prisma.user.findFirst({
        where: { schoolId: school.id, role: "SchoolAdmin" },
      });

      if (schoolAdmin) {
        await emailService.sendSubscriptionWelcomeEmail(
          schoolAdmin.email,
          schoolAdmin.name,
          school.name,
          plan.name,
          plan.amount.toString(),
          plan.maxTeachers,
          plan.maxStudents,
          endedAt
        ).catch(err => console.error("[PaymentService] Error sending welcome email:", err));
      }
    } 
    
    else if (event === "invoice.payment_failed" || event === "subscription.disable") {
      const subscriptionCode = data.subscription?.subscription_code || data.code;
      const customerEmail = data.customer?.email;

      let school = null;
      if (subscriptionCode) {
        school = await prisma.school.findFirst({
          where: { paystackSubscriptionCode: subscriptionCode },
          include: { plan: true },
        });
      }
      if (!school && customerEmail) {
        school = await prisma.school.findFirst({
          where: { contactEmail: customerEmail.toLowerCase() },
          include: { plan: true },
        });
      }

      if (!school) {
        console.error(`[PaymentService] School not found for subscription downgrade.`);
        return;
      }

      await this.downgradeSchoolToFree(school);
    }
  }

  /**
   * Manually upgrade a school (Cash payments)
   */
  static async manualUpgrade(schoolId: string, planId: string, durationMonths: number) {
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
    });

    if (!school) {
      return failResponse("School not found.");
    }

    const plan = await prisma.paymentPlan.findUnique({
      where: { id: planId },
    });

    if (!plan || !plan.isActive) {
      return failResponse("Active payment plan not found.");
    }

    const endedAt = new Date(Date.now() + durationMonths * 30 * 24 * 60 * 60 * 1000);

    await prisma.school.update({
      where: { id: schoolId },
      data: {
        planId: plan.id,
        subscriptionStatus: "Active",
        subscriptionEndedAt: endedAt,
        paystackSubscriptionCode: null, // Clear Paystack code since it's manual/cash
        paystackEmailToken: null,
        isActive: true,
      },
    });

    // Reactivate suspended accounts
    await this.reactivateSchoolSuspendedAccounts(school.id, plan.maxTeachers, plan.maxStudents);

    // Send active email
    const schoolAdmin = await prisma.user.findFirst({
      where: { schoolId: school.id, role: "SchoolAdmin" },
    });

    if (schoolAdmin) {
      await emailService.sendSubscriptionWelcomeEmail(
        schoolAdmin.email,
        schoolAdmin.name,
        school.name,
        plan.name,
        plan.amount.toString(),
        plan.maxTeachers,
        plan.maxStudents,
        endedAt
      ).catch(err => console.error("[PaymentService] Error sending welcome email:", err));
    }

    return successResponse(true, "School upgraded manually successfully.");
  }

  /**
   * Run subscription checks (Expired and Approaching Deadline)
   */
  static async runCronCheck() {
    console.log("[PaymentService] Starting daily subscription cron check.");
    const now = new Date();

    // 1. Process expired subscriptions (school has a paid plan but end date is in the past)
    const expiredSchools = await prisma.school.findMany({
      where: {
        planId: { not: null },
        subscriptionEndedAt: { lte: now },
      },
      include: { plan: true },
    });

    console.log(`[PaymentService] Found ${expiredSchools.length} expired subscriptions to downgrade.`);
    for (const school of expiredSchools) {
      try {
        await this.downgradeSchoolToFree(school);
      } catch (err: any) {
        console.error(`[PaymentService] Error downgrading school ${school.id}:`, err);
      }
    }

    // 2. Process renewal reminders (approaching deadline in 48 to 72 hours)
    const reminderStart = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const reminderEnd = new Date(now.getTime() + 72 * 60 * 60 * 1000);

    const approachingSchools = await prisma.school.findMany({
      where: {
        planId: { not: null },
        subscriptionEndedAt: {
          gte: reminderStart,
          lte: reminderEnd,
        },
      },
      include: { plan: true },
    });

    console.log(`[PaymentService] Found ${approachingSchools.length} schools approaching billing deadline.`);
    for (const school of approachingSchools) {
      if (!school.plan) continue;

      const schoolAdmin = await prisma.user.findFirst({
        where: { schoolId: school.id, role: "SchoolAdmin" },
      });

      if (schoolAdmin && school.subscriptionEndedAt) {
        await emailService.sendSubscriptionRenewalReminderEmail(
          schoolAdmin.email,
          schoolAdmin.name,
          school.name,
          school.plan.name,
          school.subscriptionEndedAt,
          school.plan.amount.toString()
        ).catch(err => console.error(`[PaymentService] Error sending reminder to ${schoolAdmin.email}:`, err));
      }
    }

    return {
      success: true,
      processedDowngrades: expiredSchools.length,
      processedReminders: approachingSchools.length,
    };
  }

  /**
   * Helper: Downgrade school to Free plan and suspend excess accounts
   */
  private static async downgradeSchoolToFree(school: any) {
    console.log(`[PaymentService] Downgrading school ${school.name} (${school.id}) to Free plan.`);

    // Find default Free plan
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

    await prisma.school.update({
      where: { id: school.id },
      data: {
        planId: freePlan.id,
        subscriptionStatus: "Expired",
        subscriptionEndedAt: null,
        paystackSubscriptionCode: null,
        paystackEmailToken: null,
      },
    });

    // Suspend excess users
    await this.suspendSchoolExcessAccounts(school.id, freePlan.maxTeachers, freePlan.maxStudents);

    // Send downgrade notification
    const schoolAdmin = await prisma.user.findFirst({
      where: { schoolId: school.id, role: "SchoolAdmin" },
    });

    if (schoolAdmin) {
      await emailService.sendSubscriptionDowngradedEmail(
        schoolAdmin.email,
        schoolAdmin.name,
        school.name,
        freePlan.name,
        freePlan.maxTeachers,
        freePlan.maxStudents
      ).catch(err => console.error("[PaymentService] Error sending downgrade email:", err));
    }
  }

  /**
   * Helper: Suspend accounts that exceed limits
   */
  private static async suspendSchoolExcessAccounts(schoolId: string, maxTeachers: number, maxStudents: number) {
    // 1. Suspend excess Teachers
    const activeTeachers = await prisma.teacher.findMany({
      where: { schoolId, isActive: true },
      orderBy: { createdAt: "desc" },
    });

    if (activeTeachers.length > maxTeachers) {
      const excessTeachers = activeTeachers.slice(0, activeTeachers.length - maxTeachers);
      console.log(`[PaymentService] Suspending ${excessTeachers.length} excess teachers for school ${schoolId}`);
      for (const t of excessTeachers) {
        await prisma.teacher.update({
          where: { id: t.id },
          data: { isActive: false, suspendedBySubscription: true },
        });
        await prisma.user.update({
          where: { id: t.userId },
          data: { isActive: false },
        });
      }
    }

    // 2. Suspend excess Students
    const activeStudents = await prisma.student.findMany({
      where: { schoolId, status: "Active" },
      orderBy: { enrolledAt: "desc" },
    });

    if (activeStudents.length > maxStudents) {
      const excessStudents = activeStudents.slice(0, activeStudents.length - maxStudents);
      console.log(`[PaymentService] Suspending ${excessStudents.length} excess students for school ${schoolId}`);
      for (const s of excessStudents) {
        await prisma.student.update({
          where: { id: s.id },
          data: { status: "Suspended", suspendedBySubscription: true },
        });
        if (s.userId) {
          await prisma.user.update({
            where: { id: s.userId },
            data: { isActive: false },
          });
        }
      }
    }
  }

  /**
   * Helper: Reactivate previously suspended accounts up to new limits
   */
  private static async reactivateSchoolSuspendedAccounts(schoolId: string, maxTeachers: number, maxStudents: number) {
    // 1. Reactivate suspended Teachers
    const activeTeachersCount = await prisma.teacher.count({
      where: { schoolId, isActive: true },
    });

    if (activeTeachersCount < maxTeachers) {
      const suspendedTeachers = await prisma.teacher.findMany({
        where: { schoolId, suspendedBySubscription: true },
        orderBy: { createdAt: "asc" },
      });

      const allowedToReactivate = maxTeachers - activeTeachersCount;
      const teachersToReactivate = suspendedTeachers.slice(0, allowedToReactivate);
      console.log(`[PaymentService] Reactivating ${teachersToReactivate.length} suspended teachers for school ${schoolId}`);

      for (const t of teachersToReactivate) {
        await prisma.teacher.update({
          where: { id: t.id },
          data: { isActive: true, suspendedBySubscription: false },
        });
        await prisma.user.update({
          where: { id: t.userId },
          data: { isActive: true },
        });
      }
    }

    // 2. Reactivate suspended Students
    const activeStudentsCount = await prisma.student.count({
      where: { schoolId, status: "Active" },
    });

    if (activeStudentsCount < maxStudents) {
      const suspendedStudents = await prisma.student.findMany({
        where: { schoolId, suspendedBySubscription: true },
        orderBy: { enrolledAt: "asc" },
      });

      const allowedToReactivate = maxStudents - activeStudentsCount;
      const studentsToReactivate = suspendedStudents.slice(0, allowedToReactivate);
      console.log(`[PaymentService] Reactivating ${studentsToReactivate.length} suspended students for school ${schoolId}`);

      for (const s of studentsToReactivate) {
        await prisma.student.update({
          where: { id: s.id },
          data: { status: "Active", suspendedBySubscription: false },
        });
        if (s.userId) {
          await prisma.user.update({
            where: { id: s.userId },
            data: { isActive: true },
          });
        }
      }
    }
  }
}
