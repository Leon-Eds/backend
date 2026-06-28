import { Router } from "express";
import { SubscriptionLogController } from "../controllers/subscriptionLog.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Subscription Logs
 *   description: Subscription payment history and analytics (SuperAdmin only)
 */

/**
 * @swagger
 * /api/subscription-logs:
 *   get:
 *     summary: Get paginated subscription payment logs
 *     tags: [Subscription Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: planId
 *         schema:
 *           type: string
 *         description: Filter by plan ID
 *       - in: query
 *         name: schoolId
 *         schema:
 *           type: string
 *         description: Filter by school ID
 *       - in: query
 *         name: source
 *         schema:
 *           type: string
 *           enum: [Paystack, Manual]
 *         description: Filter by payment source
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter payments from this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter payments until this date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Paginated payment logs retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - SuperAdmin only
 */
router.get("/", authMiddleware(["SuperAdmin"]), SubscriptionLogController.getPaymentLogs);

/**
 * @swagger
 * /api/subscription-logs/revenue-by-plan:
 *   get:
 *     summary: Get total revenue aggregated by plan
 *     tags: [Subscription Logs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Revenue by plan retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - SuperAdmin only
 */
router.get("/revenue-by-plan", authMiddleware(["SuperAdmin"]), SubscriptionLogController.getRevenueByPlan);

/**
 * @swagger
 * /api/subscription-logs/schools-by-plan/{planId}:
 *   get:
 *     summary: Get schools that paid for a specific plan
 *     tags: [Subscription Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: string
 *         description: The payment plan ID
 *     responses:
 *       200:
 *         description: Schools by plan retrieved successfully
 *       404:
 *         description: Payment plan not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - SuperAdmin only
 */
router.get("/schools-by-plan/:planId", authMiddleware(["SuperAdmin"]), SubscriptionLogController.getSchoolsByPlan);

/**
 * @swagger
 * /api/subscription-logs/subscriber-count:
 *   get:
 *     summary: Get subscriber count per plan (total unique + currently active)
 *     tags: [Subscription Logs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscriber counts retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - SuperAdmin only
 */
router.get("/subscriber-count", authMiddleware(["SuperAdmin"]), SubscriptionLogController.getSubscriberCount);

/**
 * @swagger
 * /api/subscription-logs/overview:
 *   get:
 *     summary: Get payment overview dashboard stats
 *     tags: [Subscription Logs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Overview stats retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - SuperAdmin only
 */
router.get("/overview", authMiddleware(["SuperAdmin"]), SubscriptionLogController.getOverview);

export default router;
