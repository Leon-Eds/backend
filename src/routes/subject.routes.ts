import { Router } from "express";
import { SubjectController } from "../controllers/subject.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireSchoolId } from "../middlewares/tenant.middleware";
import { validateBody } from "../middlewares/validation.middleware";
import { createSubjectSchema, updateSubjectSchema } from "../validations/subject.validation";

const router = Router();

router.use(authMiddleware(["SuperAdmin", "SchoolAdmin"]));
router.use(requireSchoolId);

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
router.get("/", SubjectController.getAll);

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
router.post("/", validateBody(createSubjectSchema), SubjectController.create);

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
router.put("/:id", validateBody(updateSubjectSchema), SubjectController.update);

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
router.delete("/:id", SubjectController.delete);

export default router;
