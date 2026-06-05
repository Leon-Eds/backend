"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboard_controller_1 = require("../controllers/dashboard.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const tenant_middleware_1 = require("../middlewares/tenant.middleware");
const router = (0, express_1.Router)();
/**
 * @swagger
 * tags:
 *   name: Dashboards
 *   description: API for retrieving metrics and stats tailored to different roles
 */
/**
 * @swagger
 * /api/dashboard/school:
 *   get:
 *     summary: Retrieve general school metrics dashboard (SuperAdmin/SchoolAdmin only)
 *     tags: [Dashboards]
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
 *         description: School dashboard metrics retrieved successfully
 */
router.get("/school", (0, auth_middleware_1.authMiddleware)(["SuperAdmin", "SchoolAdmin"]), tenant_middleware_1.requireSchoolId, dashboard_controller_1.DashboardController.getSchoolDashboard);
/**
 * @swagger
 * /api/dashboard/superadmin:
 *   get:
 *     summary: Retrieve SuperAdmin global system dashboard (SuperAdmin only)
 *     tags: [Dashboards]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: SuperAdmin global dashboard metrics retrieved successfully
 */
router.get("/superadmin", (0, auth_middleware_1.authMiddleware)(["SuperAdmin"]), dashboard_controller_1.DashboardController.getSuperAdminDashboard);
/**
 * @swagger
 * /api/dashboard/teacher:
 *   get:
 *     summary: Retrieve dashboard metrics for the authenticated teacher
 *     tags: [Dashboards]
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
 *         description: Teacher dashboard metrics retrieved successfully
 */
router.get("/teacher", (0, auth_middleware_1.authMiddleware)(["Teacher"]), tenant_middleware_1.requireSchoolId, dashboard_controller_1.DashboardController.getTeacherDashboard);
/**
 * @swagger
 * /api/dashboard/student:
 *   get:
 *     summary: Retrieve dashboard metrics for the authenticated student
 *     tags: [Dashboards]
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
 *         description: Student dashboard metrics retrieved successfully
 */
router.get("/student", (0, auth_middleware_1.authMiddleware)(["Student"]), tenant_middleware_1.requireSchoolId, dashboard_controller_1.DashboardController.getStudentDashboard);
exports.default = router;
