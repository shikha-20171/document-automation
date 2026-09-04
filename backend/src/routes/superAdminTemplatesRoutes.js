const express = require("express");
const router = express.Router();
const {
  getAllTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} = require("../controllers/superAdminTemplatesController");
const verifyToken = require("../middleware/authMiddleware");

const requireSuperAdmin = (req, res, next) => {
  const role = (req.user?.role || req.user?.rawRole || "").toUpperCase().replace(/\s+/g, "_");
  if (role === "SUPER_ADMIN" || role === "SUPERADMIN") {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: "Super Admin access required.",
  });
};

router.use(verifyToken);
router.use(requireSuperAdmin);

router.get("/", getAllTemplates);
router.get("/:id", getTemplateById);
router.post("/", createTemplate);
router.put("/:id", updateTemplate);
router.delete("/:id", deleteTemplate);

module.exports = router;
