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

/**
 * @swagger
 * /api/teacher-portal/score-progress:
 *   get:
 *     summary: Get score entry progress for a class + subject + term
 *     description: >
 *       Returns the percentage of CA1, CA2, and Exam scores recorded for a specific
 *       class, subject, and term. Helps the teacher track how much score entry they
 *       have completed. Only accessible if the teacher is assigned to the class+subject.
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
 *       - in: query
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The class ID
 *       - in: query
 *         name: subjectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The subject ID
 *       - in: query
 *         name: termId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The term ID
 *     responses:
 *       200:
 *         description: Score entry progress with CA1, CA2, and Exam percentages
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     classId:
 *                       type: string
 *                     className:
 *                       type: string
 *                     subjectId:
 *                       type: string
 *                     subjectName:
 *                       type: string
 *                     termId:
 *                       type: string
 *                     totalStudents:
 *                       type: integer
 *                       description: Total active students in the class
 *                     ca1Entered:
 *                       type: integer
 *                       description: Number of students with CA1 scores entered
 *                     ca2Entered:
 *                       type: integer
 *                       description: Number of students with CA2 scores entered
 *                     examEntered:
 *                       type: integer
 *                       description: Number of students with Exam scores entered
 *                     ca1Progress:
 *                       type: integer
 *                       description: CA1 entry progress percentage (0-100)
 *                     ca2Progress:
 *                       type: integer
 *                       description: CA2 entry progress percentage (0-100)
 *                     examProgress:
 *                       type: integer
 *                       description: Exam entry progress percentage (0-100)
 *       400:
 *         description: Missing required query params or teacher not assigned
 */
import { validateBody } from "../middlewares/validation.middleware";
import { updateTeacherSignatureSchema, updateStudentDomainsSchema } from "../validations/teacher-portal.validation";

router.get("/score-progress", TeacherPortalController.getScoreProgress);

/**
 * @swagger
 * /api/teacher-portal/signature:
 *   put:
 *     summary: Upload/update teacher signature URL
 *     tags: [Teacher Portal]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - signatureUrl
 *             properties:
 *               signatureUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Signature updated successfully
 */
router.put("/signature", validateBody(updateTeacherSignatureSchema), TeacherPortalController.updateSignature);

/**
 * @swagger
 * /api/teacher-portal/form-class/students-domains:
 *   get:
 *     summary: Get student domain ratings for a form class and term
 *     tags: [Teacher Portal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: termId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Form class student domain ratings retrieved successfully
 */
router.get("/form-class/students-domains", TeacherPortalController.getFormClassDomains);

/**
 * @swagger
 * /api/teacher-portal/form-class/students/{studentId}/domains:
 *   put:
 *     summary: Record/update student behavioral & psychological (affective & psychomotor) domains and remarks
 *     tags: [Teacher Portal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - termId
 *             properties:
 *               termId:
 *                 type: string
 *               affectiveDomains:
 *                 type: object
 *               psychomotorDomains:
 *                 type: object
 *               formTeacherRemark:
 *                 type: string
 *               daysPresent:
 *                 type: integer
 *               daysSchoolOpened:
 *                 type: integer
 *               promotedTo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Student domain ratings updated successfully
 */
router.put("/form-class/students/:studentId/domains", validateBody(updateStudentDomainsSchema), TeacherPortalController.updateStudentDomains);

/**
 * @swagger
 * /api/teacher-portal/class-broadcast:
 *   post:
 *     summary: Broadcast an announcement message to a specific class (assigned form or subject class)
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - targetClassId
 *               - title
 *               - content
 *             properties:
 *               targetClassId:
 *                 type: string
 *                 format: uuid
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [GENERAL, HEALTH, EMERGENCY, REMINDERS, SUMMONS, ACADEMIC_NOTICE]
 *                 default: ACADEMIC_NOTICE
 *                 description: Announcement category (ACADEMIC is automatically mapped to ACADEMIC_NOTICE)
 *     responses:
 *       201:
 *         description: Class broadcast created successfully
 *       400:
 *         description: Validation error or teacher not assigned to target class
 */
router.post("/class-broadcast", TeacherPortalController.sendClassBroadcast);

export default router;
