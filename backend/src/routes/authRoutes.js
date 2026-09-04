const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const {
  login,
  getMe,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
} = require("../controllers/authController");

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User Login
 *     description: Authenticate a user with email and password to receive access and refresh tokens.
 *     tags:
 *       - Auth & Security
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
 *                 example: admin@demo.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Admin@123
 *     responses:
 *       200:
 *         description: Login successful. Returns user profile and JWT token.
 */
router.post("/login", login);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get Current Authenticated User Profile
 *     description: Returns the user profile, role, and organization data for the active token.
 *     tags:
 *       - Auth & Security
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully.
 */
router.get("/me", verifyToken, getMe);

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Refresh JWT Access Token
 *     description: Exchange a valid refresh token for a newly signed access token.
 *     tags:
 *       - Auth & Security
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
 *         description: New access token generated.
 */
router.post("/refresh-token", refreshToken);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: User Logout
 *     description: Invalidate session and clear authentication cookies.
 *     tags:
 *       - Auth & Security
 *     responses:
 *       200:
 *         description: Successfully logged out.
 */
router.post("/logout", verifyToken, logout);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request Password Reset
 *     description: Generate and send a password reset link to the user's registered email address.
 *     tags:
 *       - Auth & Security
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
 *                 example: user@company.com
 *     responses:
 *       200:
 *         description: Reset email sent successfully.
 */
router.post("/forgot-password", forgotPassword);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset Password via Token
 *     description: Set a new password using the secure reset token received via email.
 *     tags:
 *       - Auth & Security
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
 *                 format: password
 *     responses:
 *       200:
 *         description: Password reset successful.
 */
router.post("/reset-password", resetPassword);

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     summary: Change Password
 *     description: Change current user password (requires authentication).
 *     tags:
 *       - Auth & Security
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
 *                 format: password
 *               newPassword:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Password changed successfully.
 */
router.post("/change-password", verifyToken, changePassword);

module.exports = router;