const prisma = require("../config/prismaClient");

const getContext = (req) => ({
  organisationId: req.user?.organisation_id || req.user?.organization_id || 1,
  userId: req.user?.id || req.user?.userId || 1,
});

const getNotifications = async (req, res) => {
  try {
    const context = getContext(req);
    const orgId = parseInt(context.organisationId, 10);
    const { filter = "all" } = req.query;

    let where = { organisation_id: orgId };
    if (filter === "unread") where.read = false;

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { created_at: "desc" },
      take: 50,
    }).catch(() => []);

    const unreadCount = notifications.filter((n) => !n.read).length;

    return res.status(200).json({
      success: true,
      data: {
        notifications,
        unreadCount,
        counts: {
          all: notifications.length,
          unread: unreadCount,
          approvals: notifications.filter((n) => (n.type || "").toLowerCase().includes("approv")).length,
          documents: notifications.filter((n) => (n.type || "").toLowerCase().includes("doc")).length,
          system: notifications.filter((n) => (n.type || "").toLowerCase().includes("system") || (n.type || "").toLowerCase().includes("info")).length,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    if (id === "ALL") {
      const context = getContext(req);
      await prisma.notification.updateMany({
        where: { organisation_id: parseInt(context.organisationId, 10) },
        data: { read: true, unread: false },
      });
      return res.status(200).json({ success: true, message: "All notifications marked as read." });
    }

    await prisma.notification.update({
      where: { id },
      data: { read: true, unread: false },
    });
    return res.status(200).json({ success: true, message: "Notification marked as read." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const markNotificationUnread = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.notification.update({
      where: { id },
      data: { read: false, unread: true },
    });
    return res.status(200).json({ success: true, message: "Notification marked as unread." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const markAllNotificationsRead = async (req, res) => {
  try {
    const context = getContext(req);
    await prisma.notification.updateMany({
      where: { organisation_id: parseInt(context.organisationId, 10) },
      data: { read: true, unread: false },
    });
    return res.status(200).json({ success: true, message: "All notifications marked as read." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.notification.delete({ where: { id } }).catch(() => null);
    return res.status(200).json({ success: true, message: "Notification deleted." });
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
