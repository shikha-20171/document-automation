const express = require("express");
const router = express.Router();
const {
  getSupportData,
  createSupportTicket,
} = require("../controllers/teamLeaderSupportController");

/**
 * @swagger
 * /team-leader/support:
 *   get:
 *     summary: Get Support FAQs & Tickets
 *     tags:
 *       - Team Leader - Support
 *     responses:
 *       200:
 *         description: Support information returned.
 */
router.get("/", getSupportData);
router.post("/tickets", createSupportTicket);

module.exports = router;
