"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const grading_controller_1 = require("../controllers/grading.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const tenant_middleware_1 = require("../middlewares/tenant.middleware");
const validation_middleware_1 = require("../middlewares/validation.middleware");
const grading_validation_1 = require("../validations/grading.validation");
const router = (0, express_1.Router)();
router.use(tenant_middleware_1.requireSchoolId);
/**
 * @swagger
 * tags:
 *   name: Grading
 *   description: API for managing grading rules and structures
 */
/**
 * @swagger
 * /api/grading/rules:
 *   post:
 *     summary: Set or update grading rules in bulk (SchoolAdmin only)
 *     tags: [Grading]
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
 *               - rules
 *             properties:
 *               rules:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - grade
 *                     - minScore
 *                     - maxScore
 *                   properties:
 *                     grade:
 *                       type: string
 *                       enum: [A, B, C, D, E, F]
 *                     minScore:
 *                       type: integer
 *                     maxScore:
 *                       type: integer
 *                     remark:
 *                       type: string
 *     responses:
 *       200:
 *         description: Grading rules configured successfully
 */
router.post("/rules", (0, auth_middleware_1.authMiddleware)(["SchoolAdmin"]), (0, validation_middleware_1.validateBody)(grading_validation_1.bulkCreateGradingRulesSchema), grading_controller_1.GradingController.setGradingRules);
/**
 * @swagger
 * /api/grading/rules:
 *   get:
 *     summary: Retrieve the current grading rules (SchoolAdmin/Teacher)
 *     tags: [Grading]
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
 *         description: Grading rules retrieved successfully
 */
router.get("/rules", (0, auth_middleware_1.authMiddleware)(["SchoolAdmin", "Teacher"]), grading_controller_1.GradingController.getGradingRules);
exports.default = router;
