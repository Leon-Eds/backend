import { Router } from "express";
import { TeacherController } from "../controllers/teacher.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireSchoolId } from "../middlewares/tenant.middleware";
import { validateBody } from "../middlewares/validation.middleware";
import { createTeacherSchema, updateTeacherSchema, assignTeacherSchema } from "../validations/teacher.validation";

const router = Router();

router.use(authMiddleware(["SuperAdmin", "SchoolAdmin"]));
router.use(requireSchoolId);

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
router.get("/", TeacherController.getAll);

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
router.get("/:id", TeacherController.getById);

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
 *               profilePictureUrl:
 *                 type: string
 *                 description: URL of the teacher's profile picture
 *     responses:
 *       201:
 *         description: Teacher created successfully
 */
router.post("/", validateBody(createTeacherSchema), TeacherController.create);

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
 *               profilePictureUrl:
 *                 type: string
 *                 description: URL of the teacher's profile picture
 *     responses:
 *       200:
 *         description: Teacher updated successfully
 *       404:
 *         description: Teacher not found
 */
router.put("/:id", validateBody(updateTeacherSchema), TeacherController.update);

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
router.put("/:id/status", TeacherController.updateStatus);

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
router.post("/:id/assign", validateBody(assignTeacherSchema), TeacherController.assign);

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
router.delete("/assignment/:assignmentId", TeacherController.removeAssignment);

export default router;
