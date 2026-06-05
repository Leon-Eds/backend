import { Router } from "express";
import { ResultController } from "../controllers/result.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireSchoolId } from "../middlewares/tenant.middleware";
import { validateBody } from "../middlewares/validation.middleware";
import { submitResultSchema, approveResultSchema } from "../validations/result.validation";

const router = Router();

router.use(requireSchoolId);

/**
 * @swagger
 * tags:
 *   name: Results
 *   description: API for computing, submitting, approving, and publishing student results
 */

/**
 * @swagger
 * /api/result/compute/{classId}/{termId}:
 *   post:
 *     summary: Compute results for a class in a given term (SchoolAdmin only)
 *     tags: [Results]
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
 *         description: Results computed successfully
 */
router.post("/compute/:classId/:termId", authMiddleware(["SchoolAdmin"]), ResultController.computeClassResults);

/**
 * @swagger
 * /api/result/submit/{classId}/{termId}:
 *   post:
 *     summary: Submit class results for approval (SchoolAdmin/Teacher)
 *     tags: [Results]
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               teacherComment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Results submitted successfully
 */
router.post("/submit/:classId/:termId", authMiddleware(["SchoolAdmin", "Teacher"]), validateBody(submitResultSchema), ResultController.submitResults);

/**
 * @swagger
 * /api/result/approve/{classId}/{termId}:
 *   post:
 *     summary: Approve or reject submitted class results (SchoolAdmin only)
 *     tags: [Results]
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               approve:
 *                 type: boolean
 *               adminComment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Results status updated successfully
 */
router.post("/approve/:classId/:termId", authMiddleware(["SchoolAdmin"]), validateBody(approveResultSchema), ResultController.approveResults);

/**
 * @swagger
 * /api/result/publish/{classId}/{termId}:
 *   post:
 *     summary: Publish approved class results (SchoolAdmin only)
 *     tags: [Results]
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
 *         description: Results published successfully
 */
router.post("/publish/:classId/:termId", authMiddleware(["SchoolAdmin"]), ResultController.publishResults);

/**
 * @swagger
 * /api/result/class/{classId}/term/{termId}:
 *   get:
 *     summary: Get all class results (SchoolAdmin/Teacher)
 *     tags: [Results]
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
 *         description: Class results retrieved successfully
 */
router.get("/class/:classId/term/:termId", authMiddleware(["SchoolAdmin", "Teacher"]), ResultController.getClassResults);

/**
 * @swagger
 * /api/result/student/{studentId}/term/{termId}:
 *   get:
 *     summary: Get results for a single student (SchoolAdmin/Teacher)
 *     tags: [Results]
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
 *         description: Student results retrieved successfully
 */
router.get("/student/:studentId/term/:termId", authMiddleware(["SchoolAdmin", "Teacher"]), ResultController.getStudentResult);

/**
 * @swagger
 * /api/result/my/term/{termId}:
 *   get:
 *     summary: Retrieve the authenticated student's results
 *     tags: [Results]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: My results retrieved successfully
 */
router.get("/my/term/:termId", authMiddleware(["Student"]), ResultController.checkMyResult);

export default router;
