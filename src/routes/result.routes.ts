import { Router } from "express";
import { ResultController } from "../controllers/result.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireSchoolId } from "../middlewares/tenant.middleware";
import { validateBody } from "../middlewares/validation.middleware";
import { submitResultSchema, approveResultSchema } from "../validations/result.validation";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Results
 *   description: API for computing, submitting, approving, and publishing student results
 */

/**
 * @swagger
 * /api/result/compute/{classId}/{termId}:
 *   post:
 *     summary: Compute results for a class in a given term (SchoolAdmin/Teacher - assigned Form Teacher if Teacher)
 *     tags: [Results]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *         description: The class ID
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
 *         description: Results computed successfully
 */
router.post("/compute/:classId/:termId", authMiddleware(["SchoolAdmin", "Teacher"]), requireSchoolId, ResultController.computeClassResults);

/**
 * @swagger
 * /api/result/submit/{classId}/{termId}:
 *   post:
 *     summary: Submit class results for approval with individual remarks (SchoolAdmin/Teacher - assigned Form Teacher if Teacher)
 *     tags: [Results]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *         description: The class ID
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
 *               remarks:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - studentId
 *                   properties:
 *                     studentId:
 *                       type: string
 *                       format: uuid
 *                     comment:
 *                       type: string
 *     responses:
 *       200:
 *         description: Results submitted successfully
 */
router.post("/submit/:classId/:termId", authMiddleware(["SchoolAdmin", "Teacher"]), requireSchoolId, validateBody(submitResultSchema), ResultController.submitResults);

/**
 * @swagger
 * /api/result/approve/{classId}/{termId}:
 *   post:
 *     summary: Approve or reject submitted class results (SchoolAdmin only)
 *     tags: [Results]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *         description: The class ID
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
 *               approve:
 *                 type: boolean
 *               adminComment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Results status updated successfully
 */
router.post("/approve/:classId/:termId", authMiddleware(["SchoolAdmin"]), requireSchoolId, validateBody(approveResultSchema), ResultController.approveResults);

/**
 * @swagger
 * /api/result/publish/{classId}/{termId}:
 *   post:
 *     summary: Publish approved class results (SchoolAdmin only)
 *     tags: [Results]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *         description: The class ID
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
 *         description: Results published successfully
 */
router.post("/publish/:classId/:termId", authMiddleware(["SchoolAdmin"]), requireSchoolId, ResultController.publishResults);

/**
 * @swagger
 * /api/result/approved/term/{termId}:
 *   get:
 *     summary: Get all school-admin approved/published class results for a term (SchoolAdmin/Teacher)
 *     description: >
 *       Retrieves class results that have been approved or published by the school admin in a particular term.
 *       Optionally filter by classId using query parameter.
 *     tags: [Results]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: termId
 *         required: true
 *         schema:
 *           type: string
 *         description: The term ID
 *       - in: query
 *         name: classId
 *         required: false
 *         schema:
 *           type: string
 *         description: Optional class ID to filter approved results for a specific class
 *       - in: header
 *         name: School-Id
 *         required: true
 *         schema:
 *           type: string
 *         description: The school ID
 *     responses:
 *       200:
 *         description: Approved class results for term retrieved successfully
 *       400:
 *         description: Term not found or invalid request
 */
router.get("/approved/term/:termId", authMiddleware(["SchoolAdmin", "Teacher"]), requireSchoolId, ResultController.getApprovedResultsByTerm);

/**
 * @swagger
 * /api/result/approved/class/{classId}/term/{termId}:
 *   get:
 *     summary: Get approved/published class results for a specific class in a term (SchoolAdmin/Teacher)
 *     tags: [Results]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *         description: The class ID
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
 *         description: Approved class results retrieved successfully
 *       400:
 *         description: No approved/published results found or invalid parameters
 */
router.get("/approved/class/:classId/term/:termId", authMiddleware(["SchoolAdmin", "Teacher"]), requireSchoolId, ResultController.getApprovedClassResults);

/**
 * @swagger
 * /api/result/class/{classId}/term/{termId}:
 *   get:
 *     summary: Get all class results (SchoolAdmin/Teacher)
 *     tags: [Results]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *         description: The class ID
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
 *         description: Class results retrieved successfully
 */
router.get("/class/:classId/term/:termId", authMiddleware(["SchoolAdmin", "Teacher"]), requireSchoolId, ResultController.getClassResults);


/**
 * @swagger
 * /api/result/student/{studentId}/term/{termId}:
 *   get:
 *     summary: Get results for a single student (SchoolAdmin/Teacher)
 *     tags: [Results]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The student ID
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
 *         description: Student results retrieved successfully
 */
router.get("/student/:studentId/term/:termId", authMiddleware(["SchoolAdmin", "Teacher"]), requireSchoolId, ResultController.getStudentResult);

/**
 * @swagger
 * /api/result/approvals/pending-count:
 *   get:
 *     summary: Get aggregate count of student results pending approval (SchoolAdmin only)
 *     tags: [Results]
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
 *         description: Pending approvals count retrieved successfully
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
 *                     count:
 *                       type: integer
 */
router.get("/approvals/pending-count", authMiddleware(["SchoolAdmin"]), requireSchoolId, ResultController.getPendingApprovalsCount);

/**
 * @swagger
 * /api/result/toggle-editing/{classId}:
 *   patch:
 *     summary: Toggle result editing active/inactive for a class (Form Teacher/SchoolAdmin)
 *     description: >
 *       Toggles the isResultEditingActive flag on a class. When active, subject teachers
 *       can enter and edit scores. When inactive, no score changes are allowed.
 *       The form teacher must deactivate result editing before submitting results.
 *     tags: [Results]
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
 *         description: Result editing status toggled successfully
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
 *                     isResultEditingActive:
 *                       type: boolean
 */
router.patch("/toggle-editing/:classId", authMiddleware(["SchoolAdmin", "Teacher"]), requireSchoolId, ResultController.toggleResultEditing);

/**
 * @swagger
 * /api/result/editing-status/{classId}:
 *   get:
 *     summary: Get the current result editing status for a class (SchoolAdmin/Teacher)
 *     tags: [Results]
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
 *         description: Result editing status retrieved successfully
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
 *                     isResultEditingActive:
 *                       type: boolean
 */
router.get("/editing-status/:classId", authMiddleware(["SchoolAdmin", "Teacher"]), requireSchoolId, ResultController.getResultEditingStatus);

/**
 * @swagger
 * /api/result/metadata/{resultId}:
 *   patch:
 *     summary: Update student result metadata (domain ratings 1-5, attendance, next term date, promotion status, comments)
 *     tags: [Results]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: resultId
 *         required: true
 *         schema:
 *           type: string
 *         description: The result ID
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
 *               affectiveDomains:
 *                 type: object
 *                 properties:
 *                   punctuality: { type: integer, example: 5 }
 *                   neatness: { type: integer, example: 5 }
 *                   politeness: { type: integer, example: 4 }
 *                   honesty: { type: integer, example: 5 }
 *                   cooperation: { type: integer, example: 4 }
 *                   peerRelationship: { type: integer, example: 5 }
 *               psychomotorDomains:
 *                 type: object
 *                 properties:
 *                   handwriting: { type: integer, example: 4 }
 *                   publicSpeaking: { type: integer, example: 3 }
 *                   sports: { type: integer, example: 5 }
 *                   clubParticipation: { type: integer, example: 4 }
 *                   craftSkills: { type: integer, example: 4 }
 *                   musicalSkill: { type: integer, example: 3 }
 *               daysSchoolOpened: { type: integer, example: 65 }
 *               daysPresent: { type: integer, example: 62 }
 *               nextTermBegins: { type: string, example: "2026-09-15" }
 *               promotedTo: { type: string, example: "Senior Secondary 3" }
 *               teacherComment: { type: string, example: "Excellent progress this term." }
 *               principalsRemark: { type: string, example: "Promoted to next level. Outstanding performance." }
 *     responses:
 *       200:
 *         description: Result metadata updated successfully
 */
router.patch("/metadata/:resultId", authMiddleware(["SchoolAdmin", "Teacher"]), requireSchoolId, ResultController.updateResultMetadata);

/**
 * @swagger
 * /api/result/my/term/{termId}:
 *   get:
 *     summary: Retrieve the authenticated student's results
 *     tags: [Results]
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
 *         description: My results retrieved successfully
 */
router.get("/my/term/:termId", authMiddleware(["Student"]), requireSchoolId, ResultController.checkMyResult);
router.get("/my-results/:termId?", authMiddleware(["Student"]), requireSchoolId, ResultController.checkMyResult);
router.get("/my-results", authMiddleware(["Student"]), requireSchoolId, ResultController.checkMyResult);

export default router;
