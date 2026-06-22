import { Router } from "express";
import { AcademicSessionController } from "../controllers/session.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireSchoolId } from "../middlewares/tenant.middleware";
import { validateBody } from "../middlewares/validation.middleware";
import { createSessionSchema, createTermSchema, updateSessionSchema, updateTermSchema } from "../validations/session.validation";

const router = Router();

// School context required for all routes
router.use(requireSchoolId);

// Auth helpers
const allRoles = authMiddleware(["SuperAdmin", "SchoolAdmin", "Teacher", "Student"]);
const adminOnly = authMiddleware(["SuperAdmin", "SchoolAdmin"]);

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
router.get("/", allRoles, AcademicSessionController.getAll);

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
router.post("/", adminOnly, validateBody(createSessionSchema), AcademicSessionController.createSession);

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
router.put("/:id/current", adminOnly, AcademicSessionController.setCurrentSession);

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
router.post("/:id/terms", adminOnly, validateBody(createTermSchema), AcademicSessionController.createTerm);

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
router.put("/terms/:termId/current", adminOnly, AcademicSessionController.setCurrentTerm);

/**
 * @swagger
 * /api/academicsession/{id}:
 *   put:
 *     summary: Update an academic session
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
 *       200:
 *         description: Session updated successfully
 */
router.put("/:id", adminOnly, validateBody(updateSessionSchema), AcademicSessionController.updateSession);

/**
 * @swagger
 * /api/academicsession/{id}:
 *   delete:
 *     summary: Delete an academic session
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
 *         description: Session deleted successfully
 */
router.delete("/:id", adminOnly, AcademicSessionController.deleteSession);

/**
 * @swagger
 * /api/academicsession/terms/{termId}:
 *   put:
 *     summary: Update a school term
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
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
 *       200:
 *         description: Term updated successfully
 */
router.put("/terms/:termId", adminOnly, validateBody(updateTermSchema), AcademicSessionController.updateTerm);

/**
 * @swagger
 * /api/academicsession/terms/{termId}:
 *   delete:
 *     summary: Delete a school term
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
 *         description: Term deleted successfully
 */
router.delete("/terms/:termId", adminOnly, AcademicSessionController.deleteTerm);

export default router;
