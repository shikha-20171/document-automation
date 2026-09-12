const prisma = require("../config/prismaClient");

const getContext = (req) => ({
  organisationId: req.user?.organisation_id || req.user?.organization_id || 1,
  userId: req.user?.id || req.user?.userId || 1,
});

const getNotifications = async (req, res) => {
  try {
    const context = getContext(req);
    const orgId = parseInt(context.organisationId, 10);
    const userId = parseInt(context.userId, 10);
    const { filter = "all" } = req.query;

    const userScope = userId ? [{ user_id: userId }, { user_id: null }] : [{ user_id: null }];

    const baseWhere = {
      organisation_id: orgId,
      OR: userScope,
    };

    const allNotifications = await prisma.notification.findMany({
      where: baseWhere,
      orderBy: { created_at: "desc" },
      take: 100,
    }).catch(() => []);

    const unreadCount = allNotifications.filter((n) => !n.read || n.unread).length;

    let filtered = allNotifications;
    if (filter === "unread") {
      filtered = allNotifications.filter((n) => !n.read || n.unread);
    } else if (filter === "approvals") {
      filtered = allNotifications.filter((n) => (n.type || "").toLowerCase().includes("approv"));
    } else if (filter === "documents") {
      filtered = allNotifications.filter((n) => (n.type || "").toLowerCase().includes("doc") || (n.category || "").toLowerCase().includes("doc"));
    } else if (filter === "system") {
      filtered = allNotifications.filter((n) => (n.type || "").toLowerCase().includes("system") || (n.type || "").toLowerCase().includes("info"));
    }

    const formattedNotifs = filtered.map((n) => ({
      ...n,
      description: n.description || n.message || "Notification alert",
      message: n.message || n.description || "Notification alert",
      read: Boolean(n.read || !n.unread),
      unread: Boolean(n.unread && !n.read),
      timestamp: n.created_at ? n.created_at.toISOString() : new Date().toISOString(),
      createdAt: n.created_at ? n.created_at.toISOString() : new Date().toISOString(),
      link: n.link || "/org-admin/approvals",
    }));

    return res.status(200).json({
      success: true,
      data: {
        notifications: formattedNotifs,
        unreadCount,
        counts: {
          all: allNotifications.length,
          unread: unreadCount,
          approvals: allNotifications.filter((n) => (n.type || "").toLowerCase().includes("approv")).length,
          documents: allNotifications.filter((n) => (n.type || "").toLowerCase().includes("doc") || (n.category || "").toLowerCase().includes("doc")).length,
          system: allNotifications.filter((n) => (n.type || "").toLowerCase().includes("system") || (n.type || "").toLowerCase().includes("info")).length,
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
      const orgId = parseInt(context.organisationId, 10);
      const userId = parseInt(context.userId, 10);
      const userScope = userId ? [{ user_id: userId }, { user_id: null }] : [{ user_id: null }];
      await prisma.notification.updateMany({
        where: {
          organisation_id: orgId,
          OR: userScope,
          AND: [{ OR: [{ read: false }, { unread: true }] }],
        },
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
    const orgId = parseInt(context.organisationId, 10);
    const userId = parseInt(context.userId, 10);
    await prisma.notification.updateMany({
      where: {
        organisation_id: orgId,
        read: false,
        ...(userId ? { OR: [{ user_id: userId }, { user_id: null }] } : {}),
      },
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
