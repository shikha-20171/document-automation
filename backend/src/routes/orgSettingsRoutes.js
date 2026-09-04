const express = require("express");
const router = express.Router();
const {
  getOrgSettings,
  updateOrgProfile,
  updateAiSettings,
  updateBranding,
  updateDocumentSettings,
} = require("../controllers/orgSettingsController");

/**
 * @swagger
 * /org-admin/settings:
 *   get:
 *     summary: Get Organisation Settings
 *     description: Retrieve organisation profile, branding assets, security controls, and AI settings.
 *     tags:
 *       - Org Admin - Settings
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Settings returned.
 */
router.get("/", getOrgSettings);

/**
 * @swagger
 * /org-admin/settings/profile:
 *   put:
 *     summary: Update Organisation Profile
 *     description: Update organisation display name, contact phone, website, and address.
 *     tags:
 *       - Org Admin - Settings
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
 *         description: Profile updated.
 */
router.put("/profile", updateOrgProfile);

/**
 * @swagger
 * /org-admin/settings/ai:
 *   put:
 *     summary: Update Organisation AI Settings
 *     description: Configure default LLM model, temperature, OCR engine preference, and confidence thresholds.
 *     tags:
 *       - Org Admin - Settings
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
 *         description: AI settings updated.
 */
router.put("/ai", updateAiSettings);

/**
 * @swagger
 * /org-admin/settings/branding:
 *   put:
 *     summary: Update Organisation Branding
 *     description: Save custom brand logo URL, primary color theme, and document header/footer text.
 *     tags:
 *       - Org Admin - Settings
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
 *         description: Branding saved.
 */
router.put("/branding", updateBranding);

/**
 * @swagger
 * /org-admin/settings/documents:
 *   put:
 *     summary: Update Document Processing Settings
 *     description: Configure retention days, automated OCR trigger rules, and export formats.
 *     tags:
 *       - Org Admin - Settings
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
 *         description: Document settings updated.
 */
router.put("/documents", updateDocumentSettings);

module.exports = router;
