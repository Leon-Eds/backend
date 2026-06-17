import { Router } from "express";
import { PaymentController } from "../controllers/payment.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: API for managing school subscriptions and payment gateway integrations
 */

/**
 * @swagger
 * /api/payment/subscribe:
 *   post:
 *     summary: Initialize a subscription checkout session (SchoolAdmin only)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - planId
 *             properties:
 *               planId:
 *                 type: string
 *               callbackUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Checkout session URL initialized successfully
 *       400:
 *         description: Invalid input or missing parameters
 *       401:
 *         description: Unauthorized
 */
router.post("/subscribe", authMiddleware(["SchoolAdmin"]), PaymentController.subscribe);

/**
 * @swagger
 * /api/payment/cancel:
 *   post:
 *     summary: Cancel card subscription auto-renewal (SchoolAdmin only)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription renewal cancelled successfully
 *       400:
 *         description: Subscription not active or error
 *       401:
 *         description: Unauthorized
 */
router.post("/cancel", authMiddleware(["SchoolAdmin"]), PaymentController.cancel);

/**
 * @swagger
 * /api/payment/webhook:
 *   post:
 *     summary: Paystack Webhook handler (Public)
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook received and acknowledged
 */
router.post("/webhook", PaymentController.webhook);

/**
 * @swagger
 * /api/payment/schools/{id}/upgrade-manual:
 *   post:
 *     summary: Manually upgrade a school (SuperAdmin only)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - planId
 *             properties:
 *               planId:
 *                 type: string
 *               durationMonths:
 *                 type: integer
 *     responses:
 *       200:
 *         description: School upgraded manually successfully
 *       400:
 *         description: Error processing manual upgrade
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - SuperAdmin only
 */
router.post("/schools/:id/upgrade-manual", authMiddleware(["SuperAdmin"]), PaymentController.manualUpgrade);

/**
 * @swagger
 * /api/payment/cron:
 *   post:
 *     summary: Cron trigger to process expired/approaching subscriptions
 *     tags: [Payments]
 *     parameters:
 *       - in: query
 *         name: secret
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cron check executed successfully
 *       403:
 *         description: Forbidden - invalid secret
 */
router.post("/cron", PaymentController.cron);
router.get("/cron", PaymentController.cron); // Also support GET for ease of triggering

export default router;
