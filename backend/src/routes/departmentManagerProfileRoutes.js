const express = require("express");
const router = express.Router();
const {
  getProfile,
  updateProfile,
  changePassword,
} = require("../controllers/departmentManagerProfileController");

/**
 * @swagger
 * /department-manager/profile:
 *   get:
 *     summary: Get Profile Details
 *     tags:
 *       - Department Manager - Core
 *     responses:
 *       200:
 *         description: Profile returned.
 */
router.get("/", getProfile);
router.put("/", updateProfile);
router.post("/change-password", changePassword);

module.exports = router;
