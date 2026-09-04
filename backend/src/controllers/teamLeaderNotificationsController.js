const teamLeaderService = require("../services/teamLeaderService");

const getNotifications = async (req, res) => {
  try {
    const { unreadCount, notifications } = await teamLeaderService.getNotifications(req);
    return res.status(200).json({ success: true, unreadCount, count: notifications.length, data: notifications });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const markNotificationAsRead = async (req, res) => {
  try {
    await teamLeaderService.markNotificationAsRead(req.params.id, req);
    return res.status(200).json({ success: true, message: "Notification marked as read." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteNotification = async (req, res) => {
  try {
    await teamLeaderService.deleteNotification(req.params.id);
    return res.status(200).json({ success: true, message: "Notification deleted." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getNotifications,
  markNotificationAsRead,
  deleteNotification,
};
