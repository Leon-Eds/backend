"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const result_controller_1 = require("../controllers/result.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const tenant_middleware_1 = require("../middlewares/tenant.middleware");
const validation_middleware_1 = require("../middlewares/validation.middleware");
const result_validation_1 = require("../validations/result.validation");
const router = (0, express_1.Router)();
router.use(tenant_middleware_1.requireSchoolId);
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
router.post("/compute/:classId/:termId", (0, auth_middleware_1.authMiddleware)(["SchoolAdmin"]), result_controller_1.ResultController.computeClassResults);
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
router.post("/submit/:classId/:termId", (0, auth_middleware_1.authMiddleware)(["SchoolAdmin", "Teacher"]), (0, validation_middleware_1.validateBody)(result_validation_1.submitResultSchema), result_controller_1.ResultController.submitResults);
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
router.post("/approve/:classId/:termId", (0, auth_middleware_1.authMiddleware)(["SchoolAdmin"]), (0, validation_middleware_1.validateBody)(result_validation_1.approveResultSchema), result_controller_1.ResultController.approveResults);
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
router.post("/publish/:classId/:termId", (0, auth_middleware_1.authMiddleware)(["SchoolAdmin"]), result_controller_1.ResultController.publishResults);
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
router.get("/class/:classId/term/:termId", (0, auth_middleware_1.authMiddleware)(["SchoolAdmin", "Teacher"]), result_controller_1.ResultController.getClassResults);
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
router.get("/student/:studentId/term/:termId", (0, auth_middleware_1.authMiddleware)(["SchoolAdmin", "Teacher"]), result_controller_1.ResultController.getStudentResult);
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
router.get("/my/term/:termId", (0, auth_middleware_1.authMiddleware)(["Student"]), result_controller_1.ResultController.checkMyResult);
exports.default = router;
