const express = require("express");
const router = express.Router();
const {
  getPlatformSettings,
  updatePlatformSettings,
} = require("../controllers/superAdminSettingsController");

/**
 * @swagger
 * /super-admin/settings:
 *   get:
 *     summary: Get Global Platform Settings
 *     description: Retrieve system-wide configurations including SMTP mailer, auth timeouts, and storage defaults.
 *     tags:
 *       - Super Admin - Settings
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Platform settings returned.
 *   put:
 *     summary: Update Global Platform Settings
 *     description: Save updated platform configuration parameters.
 *     tags:
 *       - Super Admin - Settings
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Settings saved.
 */
router.get("/", getPlatformSettings);
router.put("/", updatePlatformSettings);

module.exports = router;
