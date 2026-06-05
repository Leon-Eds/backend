import { Router } from "express";
import { DashboardController } from "../controllers/dashboard.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireSchoolId } from "../middlewares/tenant.middleware";

const router = Router();

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
router.get("/school", authMiddleware(["SuperAdmin", "SchoolAdmin"]), requireSchoolId, DashboardController.getSchoolDashboard);

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
router.get("/superadmin", authMiddleware(["SuperAdmin"]), DashboardController.getSuperAdminDashboard);

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
router.get("/teacher", authMiddleware(["Teacher"]), requireSchoolId, DashboardController.getTeacherDashboard);

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
router.get("/student", authMiddleware(["Student"]), requireSchoolId, DashboardController.getStudentDashboard);

export default router;
