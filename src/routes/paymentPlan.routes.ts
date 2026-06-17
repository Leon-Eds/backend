import { Router } from "express";
import { PaymentPlanController } from "../controllers/paymentPlan.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { validateBody } from "../middlewares/validation.middleware";
import { createPaymentPlanSchema, updatePaymentPlanSchema } from "../validations/paymentPlan.validation";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: PaymentPlans
 *   description: API for managing payment plans (SuperAdmin only)
 */

/**
 * @swagger
 * /api/payment-plans:
 *   post:
 *     summary: Create a new payment plan (SuperAdmin only)
 *     tags: [PaymentPlans]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - amount
 *               - maxTeachers
 *               - maxStudents
 *             properties:
 *               name:
 *                 type: string
 *               amount:
 *                 type: number
 *               maxTeachers:
 *                 type: integer
 *               maxStudents:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Payment plan created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - SuperAdmin only
 */
router.post(
  "/",
  authMiddleware(["SuperAdmin"]),
  validateBody(createPaymentPlanSchema),
  PaymentPlanController.create
);

/**
 * @swagger
 * /api/payment-plans:
 *   get:
 *     summary: Get all payment plans
 *     tags: [PaymentPlans]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of payment plans retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/", authMiddleware(), PaymentPlanController.getAll);

/**
 * @swagger
 * /api/payment-plans/{id}:
 *   get:
 *     summary: Get a payment plan by ID
 *     tags: [PaymentPlans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment plan details retrieved successfully
 *       404:
 *         description: Payment plan not found
 */
router.get("/:id", authMiddleware(), PaymentPlanController.getById);

/**
 * @swagger
 * /api/payment-plans/{id}:
 *   put:
 *     summary: Update an existing payment plan (SuperAdmin only)
 *     tags: [PaymentPlans]
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
 *             properties:
 *               name:
 *                 type: string
 *               amount:
 *                 type: number
 *               maxTeachers:
 *                 type: integer
 *               maxStudents:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Payment plan updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Payment plan not found
 */
router.put(
  "/:id",
  authMiddleware(["SuperAdmin"]),
  validateBody(updatePaymentPlanSchema),
  PaymentPlanController.update
);

/**
 * @swagger
 * /api/payment-plans/{id}:
 *   delete:
 *     summary: Delete a payment plan (SuperAdmin only)
 *     tags: [PaymentPlans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment plan deleted successfully
 *       404:
 *         description: Payment plan not found
 */
router.delete("/:id", authMiddleware(["SuperAdmin"]), PaymentPlanController.delete);

export default router;
