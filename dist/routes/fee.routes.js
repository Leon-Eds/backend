"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const fee_controller_1 = require("../controllers/fee.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const tenant_middleware_1 = require("../middlewares/tenant.middleware");
const validation_middleware_1 = require("../middlewares/validation.middleware");
const fee_validation_1 = require("../validations/fee.validation");
const router = (0, express_1.Router)();
router.use((0, auth_middleware_1.authMiddleware)(["SchoolAdmin"]));
router.use(tenant_middleware_1.requireSchoolId);
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
router.post("/record", (0, validation_middleware_1.validateBody)(fee_validation_1.recordFeePaymentSchema), fee_controller_1.FeeController.recordPayment);
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
router.post("/clear/:studentId/:termId", fee_controller_1.FeeController.clearStudent);
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
router.get("/student/:studentId/term/:termId", fee_controller_1.FeeController.getStudentFeeStatus);
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
router.get("/class/:classId/term/:termId", fee_controller_1.FeeController.getClassFeeOverview);
exports.default = router;
