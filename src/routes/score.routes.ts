import { Router } from "express";
import { ScoreController } from "../controllers/score.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireSchoolId } from "../middlewares/tenant.middleware";
import { validateBody } from "../middlewares/validation.middleware";
import { enterScoreSchema, bulkEnterScoresSchema } from "../validations/score.validation";

const router = Router();

router.use(authMiddleware(["SchoolAdmin", "Teacher"]));
router.use(requireSchoolId);

/**
 * @swagger
 * tags:
 *   name: Scores
 *   description: API for entering and retrieving student academic grades/scores
 */

/**
 * @swagger
 * /api/score/enter:
 *   post:
 *     summary: Enter single student score (SchoolAdmin/Teacher)
 *     tags: [Scores]
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
 *               - studentId
 *               - subjectId
 *               - classId
 *               - termId
 *               - academicSessionId
 *               - firstCA
 *               - secondCA
 *               - exam
 *             properties:
 *               studentId:
 *                 type: string
 *                 format: uuid
 *               subjectId:
 *                 type: string
 *                 format: uuid
 *               classId:
 *                 type: string
 *                 format: uuid
 *               termId:
 *                 type: string
 *                 format: uuid
 *               academicSessionId:
 *                 type: string
 *                 format: uuid
 *               firstCA:
 *                 type: number
 *               secondCA:
 *                 type: number
 *               exam:
 *                 type: number
 *               remark:
 *                 type: string
 *     responses:
 *       200:
 *         description: Score entered successfully
 */
router.post("/enter", validateBody(enterScoreSchema), ScoreController.enterScore);

/**
 * @swagger
 * /api/score/bulk-enter:
 *   post:
 *     summary: Enter student scores in bulk (SchoolAdmin/Teacher)
 *     tags: [Scores]
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
 *               - subjectId
 *               - classId
 *               - termId
 *               - academicSessionId
 *               - scores
 *             properties:
 *               subjectId:
 *                 type: string
 *                 format: uuid
 *               classId:
 *                 type: string
 *                 format: uuid
 *               termId:
 *                 type: string
 *                 format: uuid
 *               academicSessionId:
 *                 type: string
 *                 format: uuid
 *               scores:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - studentId
 *                     - firstCA
 *                     - secondCA
 *                     - exam
 *                   properties:
 *                     studentId:
 *                       type: string
 *                       format: uuid
 *                     firstCA:
 *                       type: number
 *                     secondCA:
 *                       type: number
 *                     exam:
 *                       type: number
 *                     remark:
 *                       type: string
 *     responses:
 *       200:
 *         description: Scores entered in bulk successfully
 */
router.post("/bulk-enter", validateBody(bulkEnterScoresSchema), ScoreController.bulkEnterScores);

/**
 * @swagger
 * /api/score/class/{classId}/subject/{subjectId}/term/{termId}:
 *   get:
 *     summary: Get the complete scoresheet for a class, subject and term
 *     tags: [Scores]
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
 *         name: subjectId
 *         required: true
 *         schema:
 *           type: string
 *         description: The subject ID
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
 *         description: Scoresheet retrieved successfully
 */
router.get("/class/:classId/subject/:subjectId/term/:termId", ScoreController.getClassScoreSheet);

/**
 * @swagger
 * /api/score/student/{studentId}/term/{termId}:
 *   get:
 *     summary: Get all scores for a student in a specific term
 *     tags: [Scores]
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
 *         description: Student scores retrieved successfully
 */
router.get("/student/:studentId/term/:termId", ScoreController.getStudentScores);

export default router;
