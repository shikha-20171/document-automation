const express = require("express");
const router = express.Router();
const {
  getProfile,
  updateProfile,
  changePassword,
} = require("../controllers/teamLeaderProfileController");

/**
 * @swagger
 * /team-leader/profile:
 *   get:
 *     summary: Get Profile Details
 *     tags:
 *       - Team Leader - Profile
 *     responses:
 *       200:
 *         description: Profile returned.
 */
router.get("/", getProfile);
router.put("/", updateProfile);
router.post("/change-password", changePassword);

module.exports = router;
