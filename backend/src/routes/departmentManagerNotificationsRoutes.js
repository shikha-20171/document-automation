const express = require("express");
const router = express.Router();
const {
  getNotifications,
  markNotificationRead,
  markNotificationUnread,
  markAllNotificationsRead,
  deleteNotification,
} = require("../controllers/departmentManagerNotificationsController");

/**
 * @swagger
 * /department-manager/notifications:
 *   get:
 *     summary: List Notifications
 *     tags:
 *       - Department Manager - Core
 *     responses:
 *       200:
 *         description: Notifications list.
 */
router.get("/", getNotifications);
router.post("/read-all", markAllNotificationsRead);
router.patch("/read-all", markAllNotificationsRead);
router.patch("/:id/read", markNotificationRead);
router.post("/:id/read", markNotificationRead);
router.patch("/:id/unread", markNotificationUnread);
router.delete("/:id", deleteNotification);

module.exports = router;