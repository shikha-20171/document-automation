const express = require("express");
const router = express.Router();
const {
  getNotifications,
  markNotificationAsRead,
  deleteNotification,
} = require("../controllers/teamLeaderNotificationsController");

/**
 * @swagger
 * /team-leader/notifications:
 *   get:
 *     summary: List Notifications
 *     tags:
 *       - Team Leader - Notifications
 *     responses:
 *       200:
 *         description: Notifications list.
 */
router.get("/", getNotifications);
router.patch("/read-all", (req, res) => { req.params.id = "ALL"; return markNotificationAsRead(req, res); });
router.post("/read-all", (req, res) => { req.params.id = "ALL"; return markNotificationAsRead(req, res); });
router.patch("/:id/read", markNotificationAsRead);
router.post("/:id/read", markNotificationAsRead);
router.delete("/:id", deleteNotification);

module.exports = router;
