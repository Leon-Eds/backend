import { Router } from "express";
import { BursarController } from "../controllers/bursar.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireSchoolId } from "../middlewares/tenant.middleware";
import { validateBody } from "../middlewares/validation.middleware";
import { createBursarSchema } from "../validations/bursar.validation";

const router = Router();

/**
 * @swagger
 * /api/bursar:
 *   post:
 *     summary: Register a new bursar account (SchoolAdmin only)
 *     tags: [Bursar]
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
 *               - fullName
 *               - email
 *               - password
 *             properties:
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *               profilePictureUrl:
 *                 type: string
 *                 description: URL of the bursar's profile picture
 *     responses:
 *       201:
 *         description: Bursar created successfully
 *       400:
 *         description: Bad request or validation error
 */
router.post("/", authMiddleware(["SchoolAdmin"]), requireSchoolId, validateBody(createBursarSchema), BursarController.createBursar);

// All bursar routes require Bursar or SchoolAdmin role + school context
router.use(authMiddleware(["Bursar", "SchoolAdmin"]));
router.use(requireSchoolId);

/**
 * @swagger
 * /api/bursar:
 *   get:
 *     summary: Retrieve all bursars in the school
 *     tags: [Bursar]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: School-Id
 *         required: true
 *         schema:
 *           type: string
 *         description: The school ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search query for bursar name or email
 *       - in: query
 *         name: pageNumber
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Page size
 *       - in: query
 *         name: all
 *         schema:
 *           type: boolean
 *         description: Retrieve all records (ignores pagination)
 *     responses:
 *       200:
 *         description: List of bursars retrieved successfully
 */
router.get("/", BursarController.getBursars);

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
