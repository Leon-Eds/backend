import { prisma } from "../config/db";
import { successResponse, failResponse } from "../utils/response";
import { paystack } from "../utils/paystack";

export class PaymentPlanService {
  static async createPlan(data: { name: string; amount: number; maxTeachers: number; maxStudents: number }) {
    // Check if plan name already exists
    const existingPlan = await prisma.paymentPlan.findUnique({
      where: { name: data.name },
    });

    if (existingPlan) {
      return failResponse("A payment plan with this name already exists.");
    }

    // Create plan on Paystack
    let paystackPlanCode: string | null = null;
    try {
      const paystackPlan = await paystack.createPlan(data.name, data.amount);
      if (paystackPlan.success && paystackPlan.data) {
        paystackPlanCode = paystackPlan.data.plan_code;
      }
    } catch (error: any) {
      return failResponse(`Failed to sync plan with Paystack: ${error.message}`);
    }

    // Create in database
    const plan = await prisma.paymentPlan.create({
      data: {
        name: data.name,
        amount: data.amount,
        maxTeachers: data.maxTeachers,
        maxStudents: data.maxStudents,
        paystackPlanCode,
      },
    });

    return successResponse(plan, "Payment plan created successfully.");
  }

  static async getAllPlans() {
    const plans = await prisma.paymentPlan.findMany({
      orderBy: { createdAt: "desc" },
    });
    return successResponse(plans);
  }

  static async getPlanById(id: string) {
    const plan = await prisma.paymentPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      return failResponse("Payment plan not found.");
    }

    return successResponse(plan);
  }

  static async updatePlan(
    id: string,
    data: { name?: string; amount?: number; maxTeachers?: number; maxStudents?: number; isActive?: boolean }
  ) {
    const existingPlan = await prisma.paymentPlan.findUnique({
      where: { id },
    });

    if (!existingPlan) {
      return failResponse("Payment plan not found.");
    }

    let paystackPlanCode = existingPlan.paystackPlanCode;

    // Handle name change on Paystack
    if (data.name && data.name !== existingPlan.name && paystackPlanCode) {
      try {
        await paystack.updatePlan(paystackPlanCode, data.name);
      } catch (error: any) {
        console.warn(`[PaymentPlanService] Failed to update plan name on Paystack: ${error.message}`);
      }
    }

    // Handle amount change (Paystack requires creating a new plan code if price changes)
    if (data.amount !== undefined && Number(data.amount) !== Number(existingPlan.amount)) {
      const finalName = data.name || existingPlan.name;
      try {
        const paystackPlan = await paystack.createPlan(finalName, data.amount);
        if (paystackPlan.success && paystackPlan.data) {
          paystackPlanCode = paystackPlan.data.plan_code;
        }
      } catch (error: any) {
        return failResponse(`Failed to sync new price with Paystack: ${error.message}`);
      }
    }

    const updatedPlan = await prisma.paymentPlan.update({
      where: { id },
      data: {
        name: data.name !== undefined ? data.name : undefined,
        amount: data.amount !== undefined ? data.amount : undefined,
        maxTeachers: data.maxTeachers !== undefined ? data.maxTeachers : undefined,
        maxStudents: data.maxStudents !== undefined ? data.maxStudents : undefined,
        isActive: data.isActive !== undefined ? data.isActive : undefined,
        paystackPlanCode,
      },
    });

    return successResponse(updatedPlan, "Payment plan updated successfully.");
  }

  static async deletePlan(id: string) {
    const plan = await prisma.paymentPlan.findUnique({
      where: { id },
      include: { schools: true },
    });

    if (!plan) {
      return failResponse("Payment plan not found.");
    }

    // Move all schools currently on this plan to the Free plan (by setting planId to null)
    if (plan.schools.length > 0) {
      await prisma.school.updateMany({
        where: { planId: id },
        data: { planId: null },
      });
    }

    await prisma.paymentPlan.delete({
      where: { id },
    });

    return successResponse(true, "Payment plan deleted successfully. Active schools on this plan have been reverted to Free plan limits.");
  }
}
