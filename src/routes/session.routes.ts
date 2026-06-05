import { Router } from "express";
import { AcademicSessionController } from "../controllers/session.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireSchoolId } from "../middlewares/tenant.middleware";
import { validateBody } from "../middlewares/validation.middleware";
import { createSessionSchema, createTermSchema } from "../validations/session.validation";

const router = Router();

router.use(authMiddleware(["SuperAdmin", "SchoolAdmin"]));
router.use(requireSchoolId);

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
router.get("/", AcademicSessionController.getAll);

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
router.post("/", validateBody(createSessionSchema), AcademicSessionController.createSession);

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
router.put("/:id/current", AcademicSessionController.setCurrentSession);

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
router.post("/:id/terms", validateBody(createTermSchema), AcademicSessionController.createTerm);

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
router.put("/terms/:termId/current", AcademicSessionController.setCurrentTerm);

export default router;
