import { Router } from "express";
import { TeacherPortalController } from "../controllers/teacher-portal.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireSchoolId } from "../middlewares/tenant.middleware";

const router = Router();

// All routes require Teacher role + school context
router.use(authMiddleware(["Teacher"]));
router.use(requireSchoolId);

/**
 * @swagger
 * tags:
 *   name: Teacher Portal
 *   description: Teacher-scoped APIs. Teachers can only access classes, subjects, and students they are assigned to.
 */

/**
 * @swagger
 * /api/teacher-portal/assignments:
 *   get:
 *     summary: Get all class+subject assignments for the authenticated teacher
 *     tags: [Teacher Portal]
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
 *         description: List of assignments with student counts
 */
router.get("/assignments", TeacherPortalController.getMyAssignments);

/**
 * @swagger
 * /api/teacher-portal/classes:
 *   get:
 *     summary: Get distinct classes assigned to the teacher, with subjects per class
 *     tags: [Teacher Portal]
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
 *         description: List of assigned classes with their subjects and student counts
 */
router.get("/classes", TeacherPortalController.getMyClasses);

/**
 * @swagger
 * /api/teacher-portal/subjects:
 *   get:
 *     summary: Get distinct subjects assigned to the teacher, with classes per subject
 *     tags: [Teacher Portal]
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
 *         description: List of assigned subjects with their classes
 */
router.get("/subjects", TeacherPortalController.getMySubjects);

/**
 * @swagger
 * /api/teacher-portal/classes/{classId}/students:
 *   get:
 *     summary: Get students in a class (only if teacher is assigned to that class)
 *     tags: [Teacher Portal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
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
 *         description: List of students in the class
 *       403:
 *         description: Teacher is not assigned to this class
 */
router.get("/classes/:classId/students", TeacherPortalController.getMyClassStudents);

export default router;
