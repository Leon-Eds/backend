"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const subject_controller_1 = require("../controllers/subject.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const tenant_middleware_1 = require("../middlewares/tenant.middleware");
const validation_middleware_1 = require("../middlewares/validation.middleware");
const subject_validation_1 = require("../validations/subject.validation");
const router = (0, express_1.Router)();
router.use((0, auth_middleware_1.authMiddleware)(["SuperAdmin", "SchoolAdmin"]));
router.use(tenant_middleware_1.requireSchoolId);
/**
 * @swagger
 * tags:
 *   name: Subjects
 *   description: API for managing subjects taught in a school
 */
/**
 * @swagger
 * /api/subject:
 *   get:
 *     summary: Retrieve all subjects
 *     tags: [Subjects]
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
 *         description: List of subjects retrieved successfully
 */
router.get("/", subject_controller_1.SubjectController.getAll);
/**
 * @swagger
 * /api/subject:
 *   post:
 *     summary: Create a new subject
 *     tags: [Subjects]
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
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Subject created successfully
 */
router.post("/", (0, validation_middleware_1.validateBody)(subject_validation_1.createSubjectSchema), subject_controller_1.SubjectController.create);
/**
 * @swagger
 * /api/subject/{id}:
 *   put:
 *     summary: Update an existing subject
 *     tags: [Subjects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The subject ID
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
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Subject updated successfully
 *       404:
 *         description: Subject not found
 */
router.put("/:id", (0, validation_middleware_1.validateBody)(subject_validation_1.updateSubjectSchema), subject_controller_1.SubjectController.update);
/**
 * @swagger
 * /api/subject/{id}:
 *   delete:
 *     summary: Delete a subject
 *     tags: [Subjects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The subject ID
 *       - in: header
 *         name: School-Id
 *         required: true
 *         schema:
 *           type: string
 *         description: The school ID
 *     responses:
 *       200:
 *         description: Subject deleted successfully
 *       404:
 *         description: Subject not found
 */
router.delete("/:id", subject_controller_1.SubjectController.delete);
exports.default = router;
