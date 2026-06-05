"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const score_controller_1 = require("../controllers/score.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const tenant_middleware_1 = require("../middlewares/tenant.middleware");
const validation_middleware_1 = require("../middlewares/validation.middleware");
const score_validation_1 = require("../validations/score.validation");
const router = (0, express_1.Router)();
router.use((0, auth_middleware_1.authMiddleware)(["SchoolAdmin", "Teacher"]));
router.use(tenant_middleware_1.requireSchoolId);
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
router.post("/enter", (0, validation_middleware_1.validateBody)(score_validation_1.enterScoreSchema), score_controller_1.ScoreController.enterScore);
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
router.post("/bulk-enter", (0, validation_middleware_1.validateBody)(score_validation_1.bulkEnterScoresSchema), score_controller_1.ScoreController.bulkEnterScores);
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
router.get("/class/:classId/subject/:subjectId/term/:termId", score_controller_1.ScoreController.getClassScoreSheet);
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
router.get("/student/:studentId/term/:termId", score_controller_1.ScoreController.getStudentScores);
exports.default = router;
