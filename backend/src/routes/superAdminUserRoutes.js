const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  toggleUserStatus,
  changeUserRole,
} = require("../controllers/superAdminUserController");
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

router.get("/", getAllUsers);
router.put("/:id/status", toggleUserStatus);
router.put("/:id/role", changeUserRole);

module.exports = router;
