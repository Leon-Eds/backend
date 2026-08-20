import { Router } from "express";
import { SchemeOfWorkController } from "../controllers/scheme-of-work.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireSchoolId } from "../middlewares/tenant.middleware";
import { validateBody } from "../middlewares/validation.middleware";
import {
  createSchemeOfWorkSchema,
  updateSchemeOfWorkSchema,
  reviewSchemeOfWorkSchema,
  updateTopicProgressSchema,
} from "../validations/scheme-of-work.validation";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Scheme of Work
 *   description: API for managing and viewing subject schemes of work for classes and terms
 */

/**
 * @swagger
 * /api/scheme-of-work:
 *   post:
 *     summary: Create/upload scheme of work for a subject in a class and term (Teacher/SchoolAdmin)
 *     tags: [Scheme of Work]
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
 *               - classId
 *               - subjectId
 *               - termId
 *               - topics
 *             properties:
 *               classId:
 *                 type: string
 *                 format: uuid
 *               subjectId:
 *                 type: string
 *                 format: uuid
 *               termId:
 *                 type: string
 *                 format: uuid
 *               topics:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - week
 *                     - topic
 *                   properties:
 *                     week:
 *                       type: integer
 *                       example: 1
 *                     topic:
 *                       type: string
 *                       example: "Introduction to Algebra"
 *                     description:
 *                       type: string
 *                       example: "Basic concepts and variables"
 *     responses:
 *       201:
 *         description: Scheme of work created successfully
 *       400:
 *         description: Validation or permission error
 */
router.post(
  "/",
  authMiddleware(["SchoolAdmin", "Teacher"]),
  requireSchoolId,
  validateBody(createSchemeOfWorkSchema),
  SchemeOfWorkController.createSchemeOfWork
);

/**
 * @swagger
 * /api/scheme-of-work/{id}:
 *   put:
 *     summary: Update an existing scheme of work (Teacher/SchoolAdmin)
 *     tags: [Scheme of Work]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Scheme of work ID
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
 *               - topics
 *             properties:
 *               topics:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - week
 *                     - topic
 *                   properties:
 *                     week:
 *                       type: integer
 *                     topic:
 *                       type: string
 *                     description:
 *                       type: string
 *     responses:
 *       200:
 *         description: Scheme of work updated successfully
 *       400:
 *         description: Invalid input or access denied
 */
router.put(
  "/:id",
  authMiddleware(["SchoolAdmin", "Teacher"]),
  requireSchoolId,
  validateBody(updateSchemeOfWorkSchema),
  SchemeOfWorkController.updateSchemeOfWork
);

/**
 * @swagger
 * /api/scheme-of-work/{id}:
 *   delete:
 *     summary: Delete a scheme of work (Teacher/SchoolAdmin)
 *     tags: [Scheme of Work]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Scheme of work ID
 *       - in: header
 *         name: School-Id
 *         required: true
 *         schema:
 *           type: string
 *         description: The school ID
 *     responses:
 *       200:
 *         description: Scheme of work deleted successfully
 *       400:
 *         description: Access denied or not found
 */
router.delete(
  "/:id",
  authMiddleware(["SchoolAdmin", "Teacher"]),
  requireSchoolId,
  SchemeOfWorkController.deleteSchemeOfWork
);

/**
 * @swagger
 * /api/scheme-of-work/class/{classId}/subject/{subjectId}/term/{termId}:
 *   get:
 *     summary: Get scheme of work for a specific class, subject, and term
 *     tags: [Scheme of Work]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: subjectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: termId
 *         required: true
 *         schema:
 *           type: string
 *       - in: header
 *         name: School-Id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Scheme of work retrieved successfully
 */
router.get(
  "/class/:classId/subject/:subjectId/term/:termId",
  authMiddleware(["SchoolAdmin", "Teacher", "Student"]),
  requireSchoolId,
  SchemeOfWorkController.getSchemeForSubject
);

/**
 * @swagger
 * /api/scheme-of-work/class/{classId}/term/{termId}:
 *   get:
 *     summary: Get schemes of work for ALL subjects in a class and term (Student/Teacher/SchoolAdmin)
 *     description: Returns all subjects assigned to the class along with their schemes of work (if uploaded).
 *     tags: [Scheme of Work]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: termId
 *         required: true
 *         schema:
 *           type: string
 *       - in: header
 *         name: School-Id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: All class schemes of work retrieved successfully
 */
router.get(
  "/class/:classId/term/:termId",
  authMiddleware(["SchoolAdmin", "Teacher", "Student"]),
  requireSchoolId,
  SchemeOfWorkController.getClassSchemes
);

/**
 * @swagger
 * /api/scheme-of-work/my:
 *   get:
 *     summary: Retrieve schemes of work for the authenticated student's class in the current active term
 *     tags: [Scheme of Work]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: School-Id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Student's class schemes of work retrieved successfully
 */
router.get(
  "/my",
  authMiddleware(["Student"]),
  requireSchoolId,
  SchemeOfWorkController.getMySchemes
);

/**
 * @swagger
 * /api/scheme-of-work/my/term/{termId}:
 *   get:
 *     summary: Retrieve schemes of work for the authenticated student's class in a specific term
 *     tags: [Scheme of Work]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: termId
 *         required: true
 *         schema:
 *           type: string
 *       - in: header
 *         name: School-Id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Student's class schemes of work retrieved successfully
 */
router.get(
  "/my/term/:termId",
  authMiddleware(["Student"]),
  requireSchoolId,
  SchemeOfWorkController.getMySchemes
);

/**
 * @swagger
 * /api/scheme-of-work/{id}/review:
 *   patch:
 *     summary: Review (Approve or Reject) a scheme of work (SchoolAdmin only)
 *     tags: [Scheme of Work]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Scheme of work ID
 *       - in: header
 *         name: School-Id
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
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Approved, Rejected]
 *               rejectionReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Scheme of work reviewed successfully
 *       400:
 *         description: Validation error or not found
 */
router.patch(
  "/:id/review",
  authMiddleware(["SuperAdmin", "SchoolAdmin"]),
  requireSchoolId,
  validateBody(reviewSchemeOfWorkSchema),
  SchemeOfWorkController.reviewSchemeOfWork
);

/**
 * @swagger
 * /api/scheme-of-work/{id}/progress:
 *   patch:
 *     summary: Update topic completion progress for a specific week (Teacher / SchoolAdmin)
 *     tags: [Scheme of Work]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Scheme of work ID
 *       - in: header
 *         name: School-Id
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
 *               - week
 *               - isCompleted
 *             properties:
 *               week:
 *                 type: integer
 *               isCompleted:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Topic progress updated successfully
 *       400:
 *         description: Validation error or access denied
 */
router.patch(
  "/:id/progress",
  authMiddleware(["SuperAdmin", "SchoolAdmin", "Teacher"]),
  requireSchoolId,
  validateBody(updateTopicProgressSchema),
  SchemeOfWorkController.updateTopicProgress
);

export default router;
