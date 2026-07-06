import { Router } from "express";
import { SchoolController } from "../controllers/school.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { validateBody } from "../middlewares/validation.middleware";
import { updateSchoolSchema, updateSchoolPlanSchema } from "../validations/school.validation";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Schools
 *   description: API for managing schools and subscription plans
 */

/**
 * @swagger
 * /api/school/plans:
 *   get:
 *     summary: Retrieve available subscription plans
 *     tags: [Schools]
 *     responses:
 *       200:
 *         description: List of subscription plans retrieved successfully
 */
router.get("/plans", SchoolController.getPlans);

/**
 * @swagger
 * /api/school:
 *   get:
 *     summary: Retrieve all schools (SuperAdmin only)
 *     tags: [Schools]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of schools retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - SuperAdmin only
 */
router.get("/", authMiddleware(["SuperAdmin"]), SchoolController.getAll);

/**
 * @swagger
 * /api/school/{id}:
 *   get:
 *     summary: Get a school by ID
 *     tags: [Schools]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The school ID
 *     responses:
 *       200:
 *         description: School details retrieved successfully
 *       404:
 *         description: School not found
 */
router.get("/:id", authMiddleware(), SchoolController.getById);

/**
 * @swagger
 * /api/school/{id}:
 *   put:
 *     summary: Update school profile (SuperAdmin or SchoolAdmin)
 *     tags: [Schools]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The school ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *               contactEmail:
 *                 type: string
 *                 format: email
 *               contactPhone:
 *                 type: string
 *               logoUrl:
 *                 type: string
 *               schoolTheme:
 *                 type: object
 *                 properties:
 *                   primaryColor:
 *                     type: string
 *                     example: "#1a1a2e"
 *                   secondaryColor:
 *                     type: string
 *                     example: "#16213e"
 *                   accentColor:
 *                     type: string
 *                     example: "#0f3460"
 *                   font:
 *                     type: string
 *                     example: "Inter"
 *     responses:
 *       200:
 *         description: School profile updated successfully
 *       404:
 *         description: School not found
 */
router.put("/:id", authMiddleware(["SuperAdmin", "SchoolAdmin"]), validateBody(updateSchoolSchema), SchoolController.update);

/**
 * @swagger
 * /api/school/{id}/plan:
 *   put:
 *     summary: Update school subscription plan (SuperAdmin only)
 *     tags: [Schools]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The school ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subscriptionPlan
 *             properties:
 *               subscriptionPlan:
 *                 type: string
 *                 enum: [Free, Plus, Premium]
 *     responses:
 *       200:
 *         description: School subscription plan updated successfully
 *       404:
 *         description: School not found
 */
router.put("/:id/plan", authMiddleware(["SuperAdmin"]), validateBody(updateSchoolPlanSchema), SchoolController.updatePlan);

/**
 * @swagger
 * /api/school/{id}/status:
 *   put:
 *     summary: Toggle school activation status (SuperAdmin only)
 *     tags: [Schools]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The school ID
 *     responses:
 *       200:
 *         description: School status updated successfully
 *       404:
 *         description: School not found
 */
router.put("/:id/status", authMiddleware(["SuperAdmin"]), SchoolController.updateStatus);

/**
 * @swagger
 * /api/school/{id}/reset-admin-password:
 *   put:
 *     summary: Reset a school admin's password (SuperAdmin only)
 *     tags: [Schools]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The school ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newPassword
 *             properties:
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 description: The new password for the school admin
 *     responses:
 *       200:
 *         description: School admin password reset successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: School not found
 */
router.put("/:id/reset-admin-password", authMiddleware(["SuperAdmin"]), SchoolController.resetAdminPassword);

export default router;
