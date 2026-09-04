const express = require("express");
const router = express.Router();
const { sendAdminCredentialsEmail } = require("../services/emailService");

/**
 * @swagger
 * /send-email/send-credentials:
 *   post:
 *     summary: Dispatch Admin Credentials Email
 *     description: Direct email service endpoint to send branded login credentials to an organisation admin.
 *     tags:
 *       - Email Service
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               admin_name:
 *                 type: string
 *                 example: Jane Doe
 *               admin_email:
 *                 type: string
 *                 example: jane.doe@acme.com
 *               organisation_name:
 *                 type: string
 *                 example: Acme Corporation
 *               branch:
 *                 type: string
 *                 example: Mumbai HQ
 *               city:
 *                 type: string
 *                 example: Mumbai
 *               password:
 *                 type: string
 *                 example: Admin@1234
 *     responses:
 *       200:
 *         description: Credentials email sent successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardSuccessResponse'
 *       400:
 *         description: Missing required recipient email.
 *       500:
 *         description: SMTP email dispatch failure.
 */
router.post("/send-credentials", async (req, res) => {
  try {
    const {
      admin_name,
      adminName,
      organisation_name,
      organisationName,
      branch,
      city,
      admin_email,
      adminEmail,
      email,
      password,
    } = req.body;

    const targetEmail = (admin_email || adminEmail || email || "").trim();
    const targetAdminName = (admin_name || adminName || "Organisation Admin").trim();
    const targetOrgName = (organisation_name || organisationName || "Customer Organization").trim();
    const targetCity = (city || "Headquarters").trim();
    
    // Ensure typed password is used without fallback to hardcoded default
    const finalPassword = (password && password.trim().length > 0) 
      ? password.trim() 
      : `Admin@${Math.floor(1000 + Math.random() * 9000)}`;

    if (!targetEmail) {
      return res.status(400).json({
        success: false,
        message: "Admin email address is required.",
      });
    }

    console.log(`[EmailRoute] Dispatching Gmail to: ${targetEmail} | Org: ${targetOrgName}`);

    const mailResult = await sendAdminCredentialsEmail({
      adminName: targetAdminName,
      organisationName: targetOrgName,
      branch: branch || `${targetCity} HQ`,
      city: targetCity,
      adminEmail: targetEmail,
      password: finalPassword,
    });

    if (mailResult && mailResult.success) {
      return res.status(200).json({
        success: true,
        message: `Credentials email successfully dispatched to ${targetEmail}`,
        messageId: mailResult.messageId,
      });
    } else {
      return res.status(500).json({
        success: false,
        message: mailResult.error || `Failed to send email to ${targetEmail}`,
      });
    }
  } catch (error) {
    console.error("[EmailRoute] Exception sending email:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to send email",
    });
  }
});

module.exports = router;
