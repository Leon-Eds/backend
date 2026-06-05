"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const session_controller_1 = require("../controllers/session.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const tenant_middleware_1 = require("../middlewares/tenant.middleware");
const validation_middleware_1 = require("../middlewares/validation.middleware");
const session_validation_1 = require("../validations/session.validation");
const router = (0, express_1.Router)();
router.use((0, auth_middleware_1.authMiddleware)(["SuperAdmin", "SchoolAdmin"]));
router.use(tenant_middleware_1.requireSchoolId);
/**
 * @swagger
 * tags:
 *   name: Academic Sessions
 *   description: API for managing academic sessions and school terms
 */
/**
 * @swagger
 * /api/academicsession:
 *   get:
 *     summary: Retrieve all academic sessions in the school
 *     tags: [Academic Sessions]
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
 *         description: List of academic sessions retrieved successfully
 */
router.get("/", session_controller_1.AcademicSessionController.getAll);
/**
 * @swagger
 * /api/academicsession:
 *   post:
 *     summary: Create a new academic session
 *     tags: [Academic Sessions]
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
 *               - startDate
 *               - endDate
 *             properties:
 *               name:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Academic session created successfully
 */
router.post("/", (0, validation_middleware_1.validateBody)(session_validation_1.createSessionSchema), session_controller_1.AcademicSessionController.createSession);
/**
 * @swagger
 * /api/academicsession/{id}/current:
 *   put:
 *     summary: Set the specified session as active/current
 *     tags: [Academic Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The session ID
 *       - in: header
 *         name: School-Id
 *         required: true
 *         schema:
 *           type: string
 *         description: The school ID
 *     responses:
 *       200:
 *         description: Current session updated successfully
 *       404:
 *         description: Session not found
 */
router.put("/:id/current", session_controller_1.AcademicSessionController.setCurrentSession);
/**
 * @swagger
 * /api/academicsession/{id}/terms:
 *   post:
 *     summary: Add a school term to an academic session
 *     tags: [Academic Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The session ID
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
 *               - termNumber
 *               - startDate
 *               - endDate
 *             properties:
 *               termNumber:
 *                 type: string
 *                 enum: [First, Second, Third]
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Term added successfully
 */
router.post("/:id/terms", (0, validation_middleware_1.validateBody)(session_validation_1.createTermSchema), session_controller_1.AcademicSessionController.createTerm);
/**
 * @swagger
 * /api/academicsession/terms/{termId}/current:
 *   put:
 *     summary: Set the specified term as active/current
 *     tags: [Academic Sessions]
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
 *         description: Current term updated successfully
 *       404:
 *         description: Term not found
 */
router.put("/terms/:termId/current", session_controller_1.AcademicSessionController.setCurrentTerm);
exports.default = router;
