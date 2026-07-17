import { Router } from "express";
import { ClassController } from "../controllers/class.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireSchoolId } from "../middlewares/tenant.middleware";
import { validateBody } from "../middlewares/validation.middleware";
import { createClassSchema, updateClassSchema, assignSubjectsToClassSchema } from "../validations/class.validation";

const router = Router();

// Remove top-level middleware so authMiddleware executes first to populate req.user / req.schoolId

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
router.get("/", authMiddleware(["SuperAdmin", "SchoolAdmin", "Bursar", "Teacher"]), requireSchoolId, ClassController.getAll);

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
router.get("/:id", authMiddleware(["SuperAdmin", "SchoolAdmin", "Bursar", "Teacher"]), requireSchoolId, ClassController.getById);

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
 *               formTeacherId:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Class created successfully
 *       400:
 *         description: Invalid request body
 */
router.post("/", authMiddleware(["SuperAdmin", "SchoolAdmin"]), requireSchoolId, validateBody(createClassSchema), ClassController.create);

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
 *               formTeacherId:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Class updated successfully
 *       404:
 *         description: Class not found
 */
router.put("/:id", authMiddleware(["SuperAdmin", "SchoolAdmin"]), requireSchoolId, validateBody(updateClassSchema), ClassController.update);

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
router.delete("/:id", authMiddleware(["SuperAdmin", "SchoolAdmin"]), requireSchoolId, ClassController.delete);

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
router.post("/:id/subjects", authMiddleware(["SuperAdmin", "SchoolAdmin"]), requireSchoolId, validateBody(assignSubjectsToClassSchema), ClassController.assignSubjects);

export default router;
