import { Router } from "express";
import { BursarController } from "../controllers/bursar.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireSchoolId } from "../middlewares/tenant.middleware";

const router = Router();

// All bursar routes require Bursar or SchoolAdmin role + school context
router.use(authMiddleware(["Bursar", "SchoolAdmin"]));
router.use(requireSchoolId);

/**
 * @swagger
 * tags:
 *   name: Bursar
 *   description: Fee management APIs for Bursars and SchoolAdmins
 */

/**
 * @swagger
 * /api/bursar/fees/student/{studentId}:
 *   get:
 *     summary: Get fee status for a student in a term
 *     tags: [Bursar]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: termId
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
 *         description: Fee status retrieved
 */
router.get("/fees/student/:studentId", BursarController.getStudentFeeStatus);

/**
 * @swagger
 * /api/bursar/fees/class/{classId}:
 *   get:
 *     summary: Get class fee overview (paid/owing breakdown)
 *     tags: [Bursar]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: termId
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
 *         description: Class fee overview with paid/owing students
 */
router.get("/fees/class/:classId", BursarController.getClassFeeOverview);

/**
 * @swagger
 * /api/bursar/fees/record:
 *   post:
 *     summary: Record a fee payment for a student
 *     tags: [Bursar]
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
 *               - studentId
 *               - termId
 *               - academicSessionId
 *               - amountDue
 *               - amountPaid
 *             properties:
 *               studentId:
 *                 type: string
 *               termId:
 *                 type: string
 *               academicSessionId:
 *                 type: string
 *               amountDue:
 *                 type: number
 *               amountPaid:
 *                 type: number
 *               receiptImageUrl:
 *                 type: string
 *                 description: URL of uploaded payment receipt image
 *               description:
 *                 type: string
 *                 description: Payment description or notes
 *     responses:
 *       200:
 *         description: Fee payment recorded successfully
 */
router.post("/fees/record", BursarController.recordPayment);

/**
 * @swagger
 * /api/bursar/fees/clear/{studentId}:
 *   put:
 *     summary: Clear student fees for a term
 *     tags: [Bursar]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: termId
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
 *         description: Student fee cleared
 */
router.put("/fees/clear/:studentId", BursarController.clearStudent);

/**
 * @swagger
 * /api/bursar/fees/report:
 *   get:
 *     summary: Get school-wide fee report across all classes for a term
 *     tags: [Bursar]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: termId
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
 *         description: School fee report with per-class breakdown
 */
router.get("/fees/report", BursarController.getSchoolFeeReport);

export default router;
