const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  getNotifications,
  markNotificationRead,
  markNotificationUnread,
  markAllNotificationsRead,
  deleteNotification,
} = require("../controllers/orgNotificationsController");

router.use(authMiddleware);

router.get("/", getNotifications);
router.post("/read-all", markAllNotificationsRead);
router.patch("/read-all", markAllNotificationsRead);
router.patch("/:id/read", markNotificationRead);
router.post("/:id/read", markNotificationRead);
router.patch("/:id/unread", markNotificationUnread);
router.delete("/:id", deleteNotification);

module.exports = router;
