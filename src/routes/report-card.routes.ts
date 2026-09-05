import { Router } from "express";
import { ReportCardController } from "../controllers/report-card.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireSchoolId } from "../middlewares/tenant.middleware";
import { createRateLimiter } from "../middlewares/security.middleware";

const router = Router();
const pdfLimit = createRateLimiter({ windowMs: 60 * 60 * 1000, max: 30, keyPrefix: "report-card-pdf" });

/**
 * @swagger
 * tags:
 *   name: Report Cards
 *   description: API for retrieving and generating student report cards in JSON and PDF format
 */

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
 *       400:
 *         description: Fee clearance required or student not found
 *       403:
 *         description: Access denied
 */
router.get("/my/:termId/pdf", pdfLimit, authMiddleware(["Student"]), requireSchoolId, ReportCardController.downloadMyReportCard);

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
router.get("/:studentId/:termId/pdf", pdfLimit, authMiddleware(["SchoolAdmin", "Teacher"]), requireSchoolId, ReportCardController.downloadReportCardPdf);

export default router;
