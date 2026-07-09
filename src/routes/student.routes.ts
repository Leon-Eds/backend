import { Router } from "express";
import { StudentController } from "../controllers/student.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireSchoolId } from "../middlewares/tenant.middleware";
import { validateBody } from "../middlewares/validation.middleware";
import { createStudentSchema, updateStudentSchema } from "../validations/student.validation";

const router = Router();

// Student-accessible route for self ID card download
router.get("/idcard/download", authMiddleware(["Student"]), requireSchoolId, StudentController.downloadMyIdCardPdf);

// Admin-accessible route for specific student ID card download
router.get("/:id/idcard", authMiddleware(["SuperAdmin", "SchoolAdmin"]), requireSchoolId, StudentController.downloadStudentIdCardPdf);

router.use(authMiddleware(["SuperAdmin", "SchoolAdmin", "Bursar"]));
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
 *     description: >
 *       Creates a new student and optionally links a parent/guardian.
 *       If a parent with the given email already exists in this school,
 *       the student is linked to the existing parent (no duplicate created).
 *       If no parent exists with that email, a new parent record is created.
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
 *                 description: Full name of the parent/guardian
 *               parentPhone:
 *                 type: string
 *                 description: Phone number of the parent/guardian
 *               parentEmail:
 *                 type: string
 *                 description: Email of the parent/guardian (used for deduplication)
 *               parentPassportUrl:
 *                 type: string
 *                 description: URL of the parent's passport photograph
 *               parentIdNumber:
 *                 type: string
 *                 description: Parent's ID card number (e.g. NIN, driver's license)
 *               password:
 *                 type: string
 *                 description: Optional login password for the student account (defaults to Student@123! if not provided)
 *               profilePictureUrl:
 *                 type: string
 *                 description: URL of the student's profile picture
 *               arm:
 *                 type: string
 *                 description: Class arm (e.g. A, B, C)
 *               bloodGroup:
 *                 type: string
 *                 description: Student's blood group
 *     responses:
 *       201:
 *         description: Student created successfully
 *       400:
 *         description: Validation error or student limit reached
 */
router.post("/", authMiddleware(["SuperAdmin", "SchoolAdmin"]), validateBody(createStudentSchema), StudentController.create);

/**
 * @swagger
 * /api/student/{id}:
 *   put:
 *     summary: Update a student
 *     description: >
 *       Updates student details and optionally updates the linked parent/guardian.
 *       If parentEmail changes to a different email, the student will be re-linked
 *       to an existing parent or a new parent will be created.
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
 *                 description: Full name of the parent/guardian
 *               parentPhone:
 *                 type: string
 *                 description: Phone number of the parent/guardian
 *               parentEmail:
 *                 type: string
 *                 description: Email of the parent/guardian
 *               parentPassportUrl:
 *                 type: string
 *                 description: URL of the parent's passport photograph
 *               parentIdNumber:
 *                 type: string
 *                 description: Parent's ID card number
 *               status:
 *                 type: string
 *                 enum: [Active, Graduated, Archived, Suspended, Left]
 *               profilePictureUrl:
 *                 type: string
 *                 description: URL of the student's profile picture
 *               arm:
 *                 type: string
 *               bloodGroup:
 *                 type: string
 *     responses:
 *       200:
 *         description: Student updated successfully
 *       404:
 *         description: Student not found
 */
router.put("/:id", authMiddleware(["SuperAdmin", "SchoolAdmin"]), validateBody(updateStudentSchema), StudentController.update);

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
router.delete("/:id", authMiddleware(["SuperAdmin", "SchoolAdmin"]), StudentController.delete);

/**
 * @swagger
 * /api/student/{id}/reset-password:
 *   put:
 *     summary: Reset a student's login password (SchoolAdmin only)
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
 *             required:
 *               - newPassword
 *             properties:
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 description: The new password for the student
 *     responses:
 *       200:
 *         description: Student password reset successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Student not found
 */
router.put("/:id/reset-password", authMiddleware(["SchoolAdmin"]), StudentController.resetPassword);

export default router;
