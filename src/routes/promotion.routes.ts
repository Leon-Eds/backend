import { Router } from "express";
import { PromotionController } from "../controllers/promotion.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireSchoolId } from "../middlewares/tenant.middleware";
import { validateBody } from "../middlewares/validation.middleware";
import { promoteStudentsSchema, graduateClassSchema } from "../validations/promotion.validation";

const router = Router();

// All promotion routes require SchoolAdmin role + school context
router.use(authMiddleware(["SchoolAdmin"]));
router.use(requireSchoolId);

/**
 * @swagger
 * tags:
 *   name: Promotion
 *   description: Student promotion, graduation, and status management
 */

/**
 * @swagger
 * /api/promotion/promote:
 *   post:
 *     summary: Bulk promote students from source classes to target classes
 *     description: >
 *       Atomically moves active students from old-session source classes to current-session
 *       target classes. The previous class/session enrollment is retained as history.
 *       The SchoolAdmin provides an array of class mappings.
 *     tags: [Promotion]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: School-Id
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
 *               - mappings
 *             properties:
 *               mappings:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - sourceClassId
 *                     - targetClassId
 *                   properties:
 *                     sourceClassId:
 *                       type: string
 *                       format: uuid
 *                     targetClassId:
 *                       type: string
 *                       format: uuid
 *     responses:
 *       200:
 *         description: Students promoted successfully
 */
router.post("/promote", validateBody(promoteStudentsSchema), PromotionController.promote);

/**
 * @swagger
 * /api/promotion/graduate:
 *   post:
 *     summary: Graduate all active students in a class
 *     tags: [Promotion]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: School-Id
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
 *               - classId
 *             properties:
 *               classId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Students graduated successfully
 */
router.post("/graduate", validateBody(graduateClassSchema), PromotionController.graduate);

/**
 * @swagger
 * /api/promotion/mark-left/{studentId}:
 *   put:
 *     summary: Mark a student as Left (preserves all historical records)
 *     tags: [Promotion]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *       - in: header
 *         name: School-Id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Student marked as Left
 */
router.put("/mark-left/:studentId", PromotionController.markLeft);

/**
 * @swagger
 * /api/promotion/student/{studentId}/history:
 *   get:
 *     summary: Get a student's class and promotion history across academic sessions
 *     tags: [Promotion]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: header
 *         name: School-Id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Student enrollment history retrieved
 */
router.get("/student/:studentId/history", PromotionController.getStudentHistory);

export default router;
