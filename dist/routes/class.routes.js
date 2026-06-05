"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const class_controller_1 = require("../controllers/class.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const tenant_middleware_1 = require("../middlewares/tenant.middleware");
const validation_middleware_1 = require("../middlewares/validation.middleware");
const class_validation_1 = require("../validations/class.validation");
const router = (0, express_1.Router)();
router.use((0, auth_middleware_1.authMiddleware)(["SuperAdmin", "SchoolAdmin"]));
router.use(tenant_middleware_1.requireSchoolId);
/**
 * @swagger
 * tags:
 *   name: Classes
 *   description: API for managing classes in a school
 */
/**
 * @swagger
 * /api/class:
 *   get:
 *     summary: Retrieve all classes
 *     tags: [Classes]
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
 *         description: List of classes retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/", class_controller_1.ClassController.getAll);
/**
 * @swagger
 * /api/class/{id}:
 *   get:
 *     summary: Get a class by ID
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The class ID
 *       - in: header
 *         name: School-Id
 *         required: true
 *         schema:
 *           type: string
 *         description: The school ID
 *     responses:
 *       200:
 *         description: Class retrieved successfully
 *       404:
 *         description: Class not found
 */
router.get("/:id", class_controller_1.ClassController.getById);
/**
 * @swagger
 * /api/class:
 *   post:
 *     summary: Create a new class
 *     tags: [Classes]
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
 *               arm:
 *                 type: string
 *               academicSessionId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Class created successfully
 *       400:
 *         description: Invalid request body
 */
router.post("/", (0, validation_middleware_1.validateBody)(class_validation_1.createClassSchema), class_controller_1.ClassController.create);
/**
 * @swagger
 * /api/class/{id}:
 *   put:
 *     summary: Update a class
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The class ID
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
 *               name:
 *                 type: string
 *               arm:
 *                 type: string
 *     responses:
 *       200:
 *         description: Class updated successfully
 *       404:
 *         description: Class not found
 */
router.put("/:id", (0, validation_middleware_1.validateBody)(class_validation_1.updateClassSchema), class_controller_1.ClassController.update);
/**
 * @swagger
 * /api/class/{id}:
 *   delete:
 *     summary: Delete a class
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The class ID
 *       - in: header
 *         name: School-Id
 *         required: true
 *         schema:
 *           type: string
 *         description: The school ID
 *     responses:
 *       200:
 *         description: Class deleted successfully
 *       404:
 *         description: Class not found
 */
router.delete("/:id", class_controller_1.ClassController.delete);
/**
 * @swagger
 * /api/class/{id}/subjects:
 *   post:
 *     summary: Assign subjects to a class
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The class ID
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
 *               - subjectIds
 *             properties:
 *               subjectIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *     responses:
 *       200:
 *         description: Subjects assigned successfully
 *       400:
 *         description: Invalid request body
 */
router.post("/:id/subjects", (0, validation_middleware_1.validateBody)(class_validation_1.assignSubjectsToClassSchema), class_controller_1.ClassController.assignSubjects);
exports.default = router;
