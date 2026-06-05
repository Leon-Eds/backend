import { Router } from "express";
import { StudentController } from "../controllers/student.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireSchoolId } from "../middlewares/tenant.middleware";
import { validateBody } from "../middlewares/validation.middleware";
import { createStudentSchema, updateStudentSchema } from "../validations/student.validation";

const router = Router();

router.use(authMiddleware(["SuperAdmin", "SchoolAdmin"]));
router.use(requireSchoolId);

/**
 * @swagger
 * tags:
 *   name: Students
 *   description: API for managing students in a school
 */

/**
 * @swagger
 * /api/student:
 *   get:
 *     summary: Retrieve all students
 *     tags: [Students]
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
 *         description: List of students retrieved successfully
 */
router.get("/", StudentController.getAll);

/**
 * @swagger
 * /api/student/search:
 *   get:
 *     summary: Search students
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query (e.g. name or admission number)
 *       - in: header
 *         name: School-Id
 *         required: true
 *         schema:
 *           type: string
 *         description: The school ID
 *     responses:
 *       200:
 *         description: List of matching students retrieved successfully
 */
router.get("/search", StudentController.search);

/**
 * @swagger
 * /api/student/{id}:
 *   get:
 *     summary: Get a student by ID
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The student ID
 *       - in: header
 *         name: School-Id
 *         required: true
 *         schema:
 *           type: string
 *         description: The school ID
 *     responses:
 *       200:
 *         description: Student details retrieved successfully
 *       404:
 *         description: Student not found
 */
router.get("/:id", StudentController.getById);

/**
 * @swagger
 * /api/student:
 *   post:
 *     summary: Create a new student
 *     tags: [Students]
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
 *               - gender
 *             properties:
 *               fullName:
 *                 type: string
 *               admissionNumber:
 *                 type: string
 *               gender:
 *                 type: string
 *                 enum: [Male, Female]
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               classId:
 *                 type: string
 *                 format: uuid
 *               parentName:
 *                 type: string
 *               parentPhone:
 *                 type: string
 *               parentEmail:
 *                 type: string
 *     responses:
 *       201:
 *         description: Student created successfully
 */
router.post("/", validateBody(createStudentSchema), StudentController.create);

/**
 * @swagger
 * /api/student/{id}:
 *   put:
 *     summary: Update a student
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The student ID
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
 *               gender:
 *                 type: string
 *                 enum: [Male, Female]
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               classId:
 *                 type: string
 *                 format: uuid
 *               parentName:
 *                 type: string
 *               parentPhone:
 *                 type: string
 *               parentEmail:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [Active, Graduated, Archived, Suspended]
 *     responses:
 *       200:
 *         description: Student updated successfully
 *       404:
 *         description: Student not found
 */
router.put("/:id", validateBody(updateStudentSchema), StudentController.update);

/**
 * @swagger
 * /api/student/{id}:
 *   delete:
 *     summary: Delete a student
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The student ID
 *       - in: header
 *         name: School-Id
 *         required: true
 *         schema:
 *           type: string
 *         description: The school ID
 *     responses:
 *       200:
 *         description: Student deleted successfully
 *       404:
 *         description: Student not found
 */
router.delete("/:id", StudentController.delete);

export default router;
