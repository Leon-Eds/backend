import { Router } from "express";
import { ReportCardController } from "../controllers/report-card.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireSchoolId } from "../middlewares/tenant.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Report Cards
 *   description: API for retrieving and generating student report cards in JSON and PDF format
 */

/**
 * @swagger
 * /api/reportcard/{studentId}/{termId}:
 *   get:
 *     summary: Retrieve JSON data for a student's report card
 *     tags: [Report Cards]
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
 *         description: Report card JSON data retrieved successfully
 */
router.get("/:studentId/:termId", authMiddleware(["SchoolAdmin", "Teacher"]), requireSchoolId, ReportCardController.getReportCard);

/**
 * @swagger
 * /api/reportcard/{studentId}/{termId}/pdf:
 *   get:
 *     summary: Download a student's report card as a PDF
 *     tags: [Report Cards]
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
 *         description: Report card PDF generated and downloaded successfully
 */
router.get("/:studentId/:termId/pdf", authMiddleware(["SchoolAdmin", "Teacher"]), requireSchoolId, ReportCardController.downloadReportCardPdf);

/**
 * @swagger
 * /api/reportcard/my/{termId}/pdf:
 *   get:
 *     summary: Download the authenticated student's own report card as a PDF
 *     tags: [Report Cards]
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
 *         description: Student's own report card PDF downloaded successfully
 */
router.get("/my/:termId/pdf", authMiddleware(["Student"]), requireSchoolId, ReportCardController.downloadMyReportCard);

export default router;
