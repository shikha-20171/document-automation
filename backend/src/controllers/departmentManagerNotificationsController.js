const departmentManagerService = require("../services/departmentManagerService");

const getNotifications = async (req, res) => {
  try {
    const data = await departmentManagerService.getNotifications(req);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const markNotificationRead = async (req, res) => {
  try {
    await departmentManagerService.markNotificationRead(req.params.id);
    return res.status(200).json({ success: true, message: "Marked as read." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const markNotificationUnread = async (req, res) => {
  try {
    await departmentManagerService.markNotificationUnread(req.params.id);
    return res.status(200).json({ success: true, message: "Marked as unread." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const markAllNotificationsRead = async (req, res) => {
  try {
    await departmentManagerService.markAllNotificationsRead(req);
    return res.status(200).json({ success: true, message: "All notifications marked as read." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteNotification = async (req, res) => {
  try {
    await departmentManagerService.deleteNotification(req.params.id);
    return res.status(200).json({ success: true, message: "Notification removed." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getNotifications,
  markNotificationRead,
  markNotificationUnread,
  markAllNotificationsRead,
  deleteNotification,
};
