import { Router } from "express";
import { FeeController } from "../controllers/fee.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireSchoolId } from "../middlewares/tenant.middleware";
import { validateBody } from "../middlewares/validation.middleware";
import { recordFeePaymentSchema } from "../validations/fee.validation";

const router = Router();

router.use(authMiddleware(["SchoolAdmin"]));
router.use(requireSchoolId);

/**
 * @swagger
 * tags:
 *   name: Fees
 *   description: API for recording and retrieving student fee payments
 */

/**
 * @swagger
 * /api/fee/record:
 *   post:
 *     summary: Record a fee payment for a student (SchoolAdmin only)
 *     tags: [Fees]
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
 *               - studentId
 *               - termId
 *               - academicSessionId
 *               - amountDue
 *               - amountPaid
 *             properties:
 *               studentId:
 *                 type: string
 *                 format: uuid
 *               termId:
 *                 type: string
 *                 format: uuid
 *               academicSessionId:
 *                 type: string
 *                 format: uuid
 *               amountDue:
 *                 type: number
 *               amountPaid:
 *                 type: number
 *     responses:
 *       200:
 *         description: Fee payment recorded successfully
 */
router.post("/record", validateBody(recordFeePaymentSchema), FeeController.recordPayment);

/**
 * @swagger
 * /api/fee/clear/{studentId}/{termId}:
 *   post:
 *     summary: Mark a student's fees as fully cleared for a term (SchoolAdmin only)
 *     tags: [Fees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The student ID
 *       - in: path
 *         name: termId
 *         required: true
 *         schema:
 *           type: string
 *         description: The term ID
 *       - in: header
 *         name: School-Id
 *         required: true
 *         schema:
 *           type: string
 *         description: The school ID
 *     responses:
 *       200:
 *         description: Student fees cleared successfully
 */
router.post("/clear/:studentId/:termId", FeeController.clearStudent);

/**
 * @swagger
 * /api/fee/student/{studentId}/term/{termId}:
 *   get:
 *     summary: Get a student's fee status for a specific term (SchoolAdmin only)
 *     tags: [Fees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The student ID
 *       - in: path
 *         name: termId
 *         required: true
 *         schema:
 *           type: string
 *         description: The term ID
 *       - in: header
 *         name: School-Id
 *         required: true
 *         schema:
 *           type: string
 *         description: The school ID
 *     responses:
 *       200:
 *         description: Student fee status retrieved successfully
 */
router.get("/student/:studentId/term/:termId", FeeController.getStudentFeeStatus);

/**
 * @swagger
 * /api/fee/class/{classId}/term/{termId}:
 *   get:
 *     summary: Get the fee overview for all students in a class (SchoolAdmin only)
 *     tags: [Fees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *         description: The class ID
 *       - in: path
 *         name: termId
 *         required: true
 *         schema:
 *           type: string
 *         description: The term ID
 *       - in: header
 *         name: School-Id
 *         required: true
 *         schema:
 *           type: string
 *         description: The school ID
 *     responses:
 *       200:
 *         description: Class fee overview retrieved successfully
 */
router.get("/class/:classId/term/:termId", FeeController.getClassFeeOverview);

export default router;
