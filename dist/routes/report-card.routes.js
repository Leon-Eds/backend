"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const report_card_controller_1 = require("../controllers/report-card.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const tenant_middleware_1 = require("../middlewares/tenant.middleware");
const router = (0, express_1.Router)();
router.use(tenant_middleware_1.requireSchoolId);
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
router.get("/:studentId/:termId", (0, auth_middleware_1.authMiddleware)(["SchoolAdmin", "Teacher"]), report_card_controller_1.ReportCardController.getReportCard);
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
router.get("/:studentId/:termId/pdf", (0, auth_middleware_1.authMiddleware)(["SchoolAdmin", "Teacher"]), report_card_controller_1.ReportCardController.downloadReportCardPdf);
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
router.get("/my/:termId/pdf", (0, auth_middleware_1.authMiddleware)(["Student"]), report_card_controller_1.ReportCardController.downloadMyReportCard);
exports.default = router;
