const express = require("express");
const router = express.Router();
const {
  getOrgSettings,
  updateOrgProfile,
  updateAiSettings,
  updateBranding,
  updateDocumentSettings,
  updateSectionSettings,
} = require("../controllers/orgSettingsController");

// Specific routes
router.get("/", getOrgSettings);
router.put("/profile", updateOrgProfile);
router.put("/ai", updateAiSettings);
router.put("/branding", updateBranding);
router.put("/documents", updateDocumentSettings);

// Generic section route for all 11 settings sections
router.put("/:section", updateSectionSettings);

module.exports = router;
