import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
import { SubscriptionLogService } from "../services/subscriptionLog.service";

export class SubscriptionLogController {
  /**
   * GET /api/subscription-logs
   * Paginated payment log history
   */
  static async getPaymentLogs(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { planId, schoolId, source, startDate, endDate, page, pageSize } = req.query;

      const result = await SubscriptionLogService.getPaymentLogs({
        planId: planId as string,
        schoolId: schoolId as string,
        source: source as string,
        startDate: startDate as string,
        endDate: endDate as string,
        page: page ? parseInt(page as string, 10) : undefined,
        pageSize: pageSize ? parseInt(pageSize as string, 10) : undefined,
      });

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/subscription-logs/revenue-by-plan
   * Total revenue aggregated by plan
   */
  static async getRevenueByPlan(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await SubscriptionLogService.getRevenueByPlan();
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/subscription-logs/schools-by-plan/:planId
   * Schools that paid for a specific plan
   */
  static async getSchoolsByPlan(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { planId } = req.params;
      if (!planId) {
        return res.status(400).json({ success: false, message: "planId is required." });
      }

      const result = await SubscriptionLogService.getSchoolsByPlan(planId);
      if (!result.success) {
        return res.status(404).json(result);
      }
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/subscription-logs/subscriber-count
   * Number of distinct paying schools per plan
   */
  static async getSubscriberCount(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await SubscriptionLogService.getSubscriberCountByPlan();
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/subscription-logs/overview
   * Dashboard summary stats
   */
  static async getOverview(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await SubscriptionLogService.getOverviewStats();
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
