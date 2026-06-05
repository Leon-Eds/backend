"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const teacher_controller_1 = require("../controllers/teacher.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const tenant_middleware_1 = require("../middlewares/tenant.middleware");
const validation_middleware_1 = require("../middlewares/validation.middleware");
const teacher_validation_1 = require("../validations/teacher.validation");
const router = (0, express_1.Router)();
router.use((0, auth_middleware_1.authMiddleware)(["SuperAdmin", "SchoolAdmin"]));
router.use(tenant_middleware_1.requireSchoolId);
/**
 * @swagger
 * tags:
 *   name: Teachers
 *   description: API for managing teachers and classroom assignments
 */
/**
 * @swagger
 * /api/teacher:
 *   get:
 *     summary: Retrieve all teachers in the school
 *     tags: [Teachers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: School-Id
 *         required: true
 *         schema:
 *           type: string
 *         description: The school ID
 *     responses:
 *       200:
 *         description: List of teachers retrieved successfully
 */
router.get("/", teacher_controller_1.TeacherController.getAll);
/**
 * @swagger
 * /api/teacher/{id}:
 *   get:
 *     summary: Get a teacher by ID
 *     tags: [Teachers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The teacher ID
 *       - in: header
 *         name: School-Id
 *         required: true
 *         schema:
 *           type: string
 *         description: The school ID
 *     responses:
 *       200:
 *         description: Teacher details retrieved successfully
 *       404:
 *         description: Teacher not found
 */
router.get("/:id", teacher_controller_1.TeacherController.getById);
/**
 * @swagger
 * /api/teacher:
 *   post:
 *     summary: Register a new teacher account
 *     tags: [Teachers]
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
 *     responses:
 *       201:
 *         description: Teacher created successfully
 */
router.post("/", (0, validation_middleware_1.validateBody)(teacher_validation_1.createTeacherSchema), teacher_controller_1.TeacherController.create);
/**
 * @swagger
 * /api/teacher/{id}:
 *   put:
 *     summary: Update teacher details
 *     tags: [Teachers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The teacher ID
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
 *               fullName:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Teacher updated successfully
 *       404:
 *         description: Teacher not found
 */
router.put("/:id", (0, validation_middleware_1.validateBody)(teacher_validation_1.updateTeacherSchema), teacher_controller_1.TeacherController.update);
/**
 * @swagger
 * /api/teacher/{id}/status:
 *   put:
 *     summary: Toggle teacher active status
 *     tags: [Teachers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The teacher ID
 *       - in: header
 *         name: School-Id
 *         required: true
 *         schema:
 *           type: string
 *         description: The school ID
 *     responses:
 *       200:
 *         description: Teacher status updated successfully
 *       404:
 *         description: Teacher not found
 */
router.put("/:id/status", teacher_controller_1.TeacherController.updateStatus);
/**
 * @swagger
 * /api/teacher/{id}/assign:
 *   post:
 *     summary: Assign a teacher to a class and subject
 *     tags: [Teachers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The teacher ID
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
 *               - subjectId
 *               - classId
 *             properties:
 *               subjectId:
 *                 type: string
 *                 format: uuid
 *               classId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Teacher assigned successfully
 */
router.post("/:id/assign", (0, validation_middleware_1.validateBody)(teacher_validation_1.assignTeacherSchema), teacher_controller_1.TeacherController.assign);
/**
 * @swagger
 * /api/teacher/assignment/{assignmentId}:
 *   delete:
 *     summary: Remove a teacher assignment
 *     tags: [Teachers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The assignment ID
 *       - in: header
 *         name: School-Id
 *         required: true
 *         schema:
 *           type: string
 *         description: The school ID
 *     responses:
 *       200:
 *         description: Assignment removed successfully
 */
router.delete("/assignment/:assignmentId", teacher_controller_1.TeacherController.removeAssignment);
exports.default = router;
