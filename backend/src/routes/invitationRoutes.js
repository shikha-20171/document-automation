const express = require("express");
const router = express.Router();
const {
  verifyInvitationController,
  activateAccountController,
} = require("../controllers/invitationController");

/**
 * @swagger
 * /auth/invitation/verify:
 *   post:
 *     summary: Verify Invitation Token
 *     description: Verify the validity of an invitation token for Organisation Admin or Team Leader onboarding.
 *     tags:
 *       - Invitations
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: Secure invitation token sent via email.
 *                 example: a8f9e1d2c3b4...
 *     responses:
 *       200:
 *         description: Token is valid. Returns organisation and invited user details.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     valid: { type: boolean, example: true }
 *                     organisation: { type: object }
 *                     admin: { type: object }
 *       400:
 *         description: Token is missing, expired, or invalid.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardErrorResponse'
 */
router.post("/verify", verifyInvitationController);

/**
 * @swagger
 * /auth/invitation/activate:
 *   post:
 *     summary: Activate Account & Set Password
 *     description: Complete invited account onboarding by verifying the token, hashing password, and marking account active.
 *     tags:
 *       - Invitations
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *                 example: a8f9e1d2c3b4...
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SecureAdminPass@123
 *     responses:
 *       200:
 *         description: Account activated successfully. User can now log in.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardSuccessResponse'
 *       400:
 *         description: Activation failed due to expired token or weak password.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardErrorResponse'
 */
router.post("/activate", activateAccountController);

module.exports = router;
