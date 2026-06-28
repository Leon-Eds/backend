import { prisma } from "../config/db";
import { successResponse, failResponse, createPagedResult } from "../utils/response";

export class SubscriptionLogService {
  /**
   * Log a subscription payment event
   */
  static async logPayment(data: {
    schoolId: string;
    planId: string;
    amount: number;
    source: "Paystack" | "Manual";
    reference?: string;
    durationDays: number;
  }) {
    const log = await prisma.subscriptionPaymentLog.create({
      data: {
        schoolId: data.schoolId,
        planId: data.planId,
        amount: data.amount,
        source: data.source,
        reference: data.reference || null,
        durationDays: data.durationDays,
      },
    });
    return log;
  }

  /**
   * Paginated list of all payment logs with optional filters
   */
  static async getPaymentLogs(filters: {
    planId?: string;
    schoolId?: string;
    source?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (filters.planId) where.planId = filters.planId;
    if (filters.schoolId) where.schoolId = filters.schoolId;
    if (filters.source) where.source = filters.source;

    if (filters.startDate || filters.endDate) {
      where.paidAt = {};
      if (filters.startDate) where.paidAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.paidAt.lte = new Date(filters.endDate);
    }

    const [logs, totalCount] = await Promise.all([
      prisma.subscriptionPaymentLog.findMany({
        where,
        include: {
          school: { select: { id: true, name: true, contactEmail: true } },
          plan: { select: { id: true, name: true, amount: true } },
        },
        orderBy: { paidAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.subscriptionPaymentLog.count({ where }),
    ]);

    const paged = createPagedResult(logs, totalCount, page, pageSize);
    return successResponse(paged);
  }

  /**
   * Aggregate total revenue grouped by plan
   */
  static async getRevenueByPlan() {
    const results = await prisma.subscriptionPaymentLog.groupBy({
      by: ["planId"],
      _sum: { amount: true },
      _count: { id: true },
    });

    // Enrich with plan names
    const planIds = results.map((r) => r.planId);
    const plans = await prisma.paymentPlan.findMany({
      where: { id: { in: planIds } },
      select: { id: true, name: true, amount: true },
    });

    const planMap = new Map(plans.map((p) => [p.id, p]));

    const data = results.map((r) => ({
      planId: r.planId,
      planName: planMap.get(r.planId)?.name || "Unknown",
      planPrice: planMap.get(r.planId)?.amount || 0,
      totalRevenue: r._sum.amount || 0,
      totalPayments: r._count.id,
    }));

    return successResponse(data, "Revenue by plan retrieved successfully.");
  }

  /**
   * List distinct schools that have paid for a specific plan
   */
  static async getSchoolsByPlan(planId: string) {
    const plan = await prisma.paymentPlan.findUnique({ where: { id: planId } });
    if (!plan) {
      return failResponse("Payment plan not found.");
    }

    const logs = await prisma.subscriptionPaymentLog.findMany({
      where: { planId },
      select: {
        schoolId: true,
        school: { select: { id: true, name: true, contactEmail: true, city: true, state: true } },
        amount: true,
        paidAt: true,
        source: true,
      },
      orderBy: { paidAt: "desc" },
    });

    // Group by school to get unique schools with their payment history
    const schoolMap = new Map<string, {
      school: any;
      totalPaid: number;
      paymentCount: number;
      lastPayment: Date;
    }>();

    for (const log of logs) {
      const existing = schoolMap.get(log.schoolId);
      if (existing) {
        existing.totalPaid += Number(log.amount);
        existing.paymentCount += 1;
        if (log.paidAt > existing.lastPayment) {
          existing.lastPayment = log.paidAt;
        }
      } else {
        schoolMap.set(log.schoolId, {
          school: log.school,
          totalPaid: Number(log.amount),
          paymentCount: 1,
          lastPayment: log.paidAt,
        });
      }
    }

    const data = {
      plan: { id: plan.id, name: plan.name, amount: plan.amount },
      uniqueSchools: schoolMap.size,
      schools: Array.from(schoolMap.values()),
    };

    return successResponse(data, "Schools by plan retrieved successfully.");
  }

  /**
   * Count of distinct paying schools per plan
   */
  static async getSubscriberCountByPlan() {
    // Get all plans
    const plans = await prisma.paymentPlan.findMany({
      select: { id: true, name: true, amount: true },
      orderBy: { amount: "asc" },
    });

    const data = await Promise.all(
      plans.map(async (plan) => {
        const distinctSchools = await prisma.subscriptionPaymentLog.findMany({
          where: { planId: plan.id },
          select: { schoolId: true },
          distinct: ["schoolId"],
        });

        // Also count currently active subscribers
        const activeSubscribers = await prisma.school.count({
          where: { planId: plan.id, subscriptionStatus: "Active" },
        });

        return {
          planId: plan.id,
          planName: plan.name,
          planPrice: plan.amount,
          totalUniqueSubscribers: distinctSchools.length,
          currentlyActive: activeSubscribers,
        };
      })
    );

    return successResponse(data, "Subscriber count by plan retrieved successfully.");
  }

  /**
   * Overview dashboard statistics
   */
  static async getOverviewStats() {
    const [totalPayments, revenueResult, uniqueSchools, totalSchools] = await Promise.all([
      prisma.subscriptionPaymentLog.count(),
      prisma.subscriptionPaymentLog.aggregate({ _sum: { amount: true } }),
      prisma.subscriptionPaymentLog.findMany({
        select: { schoolId: true },
        distinct: ["schoolId"],
      }),
      prisma.school.count(),
    ]);

    // Revenue by source
    const bySource = await prisma.subscriptionPaymentLog.groupBy({
      by: ["source"],
      _sum: { amount: true },
      _count: { id: true },
    });

    // Recent 10 payments
    const recentPayments = await prisma.subscriptionPaymentLog.findMany({
      include: {
        school: { select: { id: true, name: true } },
        plan: { select: { id: true, name: true } },
      },
      orderBy: { paidAt: "desc" },
      take: 10,
    });

    const data = {
      totalRevenue: revenueResult._sum.amount || 0,
      totalPayments,
      totalUniquePayingSchools: uniqueSchools.length,
      totalSchools,
      bySource: bySource.map((s) => ({
        source: s.source,
        totalRevenue: s._sum.amount || 0,
        totalPayments: s._count.id,
      })),
      recentPayments,
    };

    return successResponse(data, "Overview stats retrieved successfully.");
  }
}
