import { Router } from "express";
import { GradingController } from "../controllers/grading.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireSchoolId } from "../middlewares/tenant.middleware";
import { validateBody } from "../middlewares/validation.middleware";
import { bulkCreateGradingRulesSchema } from "../validations/grading.validation";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Grading
 *   description: API for managing grading rules and structures
 */

/**
 * @swagger
 * /api/grading/rules:
 *   post:
 *     summary: Set or update grading rules in bulk (SchoolAdmin only)
 *     tags: [Grading]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: School-Id
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
 *               - rules
 *             properties:
 *               rules:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - grade
 *                     - minScore
 *                     - maxScore
 *                   properties:
 *                     grade:
 *                       type: string
 *                       enum: [A, B, C, D, E, F]
 *                     minScore:
 *                       type: integer
 *                     maxScore:
 *                       type: integer
 *                     remark:
 *                       type: string
 *     responses:
 *       200:
 *         description: Grading rules configured successfully
 */
router.post("/rules", authMiddleware(["SchoolAdmin"]), requireSchoolId, validateBody(bulkCreateGradingRulesSchema), GradingController.setGradingRules);

/**
 * @swagger
 * /api/grading/rules:
 *   get:
 *     summary: Retrieve the current grading rules (SchoolAdmin/Teacher)
 *     tags: [Grading]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: School-Id
 *         required: true
 *         schema:
 *           type: string
 *         description: The school ID
 *     responses:
 *       200:
 *         description: Grading rules retrieved successfully
 */
router.get("/rules", authMiddleware(["SchoolAdmin", "Teacher"]), requireSchoolId, GradingController.getGradingRules);

export default router;
