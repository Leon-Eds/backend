"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const validation_middleware_1 = require("../middlewares/validation.middleware");
const auth_validation_1 = require("../validations/auth.validation");
const router = (0, express_1.Router)();
/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: API for managing authentication and registration
 */
/**
 * @swagger
 * /api/auth/create-super-admin:
 *   post:
 *     summary: Create a Super Admin account
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - secretKey
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               secretKey:
 *                 type: string
 *     responses:
 *       201:
 *         description: Super Admin created successfully
 *       400:
 *         description: Bad request
 */
router.post("/create-super-admin", (0, validation_middleware_1.validateBody)(auth_validation_1.createSuperAdminSchema), auth_controller_1.AuthController.createSuperAdmin);
/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new school with an admin account
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - schoolName
 *               - adminName
 *               - email
 *               - password
 *             properties:
 *               schoolName:
 *                 type: string
 *               adminName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               subscriptionPlan:
 *                 type: string
 *                 enum: [Free, Plus, Premium]
 *     responses:
 *       201:
 *         description: School registered successfully
 *       400:
 *         description: Bad request
 */
router.post("/register", (0, validation_middleware_1.validateBody)(auth_validation_1.registerSchoolSchema), auth_controller_1.AuthController.register);
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Log in to an existing account
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful, returns JWT token and details
 *       401:
 *         description: Unauthorized
 */
router.post("/login", (0, validation_middleware_1.validateBody)(auth_validation_1.loginSchema), auth_controller_1.AuthController.login);
/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     summary: Refresh JWT token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Unauthorized
 */
router.post("/refresh-token", (0, validation_middleware_1.validateBody)(auth_validation_1.refreshTokenSchema), auth_controller_1.AuthController.refreshToken);
/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Change password for the current authenticated user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       401:
 *         description: Unauthorized
 */
router.post("/change-password", (0, auth_middleware_1.authMiddleware)(), (0, validation_middleware_1.validateBody)(auth_validation_1.changePasswordSchema), auth_controller_1.AuthController.changePassword);
exports.default = router;
