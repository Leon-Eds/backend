import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { validateBody } from "../middlewares/validation.middleware";
import { createRateLimiter } from "../middlewares/security.middleware";
import {
  loginSchema,
  registerSchoolSchema,
  createSuperAdminSchema,
  refreshTokenSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyOtpSchema,
  resendOtpSchema,
} from "../validations/auth.validation";

const router = Router();
const authAttemptLimit = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 10, keyPrefix: "auth-attempt" });
const authRequestLimit = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 5, keyPrefix: "auth-request" });
const registrationLimit = createRateLimiter({ windowMs: 60 * 60 * 1000, max: 5, keyPrefix: "auth-registration" });

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
router.post("/create-super-admin", registrationLimit, validateBody(createSuperAdminSchema), AuthController.createSuperAdmin);

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
 *               schoolType:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               country:
 *                 type: string
 *               studentCount:
 *                 type: integer
 *               adminRole:
 *                 type: string
 *     responses:
 *       201:
 *         description: School registered successfully
 *       400:
 *         description: Bad request
 */
router.post("/register", registrationLimit, validateBody(registerSchoolSchema), AuthController.register);

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
router.post("/login", authAttemptLimit, validateBody(loginSchema), AuthController.login);

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
router.post("/refresh-token", authAttemptLimit, validateBody(refreshTokenSchema), AuthController.refreshToken);

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
router.post("/change-password", authMiddleware(), validateBody(changePasswordSchema), AuthController.changePassword);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout and invalidate refresh token
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       401:
 *         description: Unauthorized
 */
router.post("/logout", authMiddleware(), AuthController.logout);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request a password reset link
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Generic acknowledgement; the reset token is sent only by email
 *       400:
 *         description: Bad request
 */
router.post("/forgot-password", authRequestLimit, validateBody(forgotPasswordSchema), AuthController.forgotPassword);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password using a reset token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid or expired token
 */
router.post("/reset-password", authAttemptLimit, validateBody(resetPasswordSchema), AuthController.resetPassword);

/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verify email address using the received OTP
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email verified successfully, returns JWT token and details
 *       400:
 *         description: Invalid or expired OTP
 */
router.post("/verify-otp", authAttemptLimit, validateBody(verifyOtpSchema), AuthController.verifyOtp);

/**
 * @swagger
 * /api/auth/resend-otp:
 *   post:
 *     summary: Request a new email verification OTP code
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: A new verification OTP has been sent
 *       400:
 *         description: User not found or already verified
 */
router.post("/resend-otp", authRequestLimit, validateBody(resendOtpSchema), AuthController.resendOtp);

export default router;
