const prisma = require("../config/prismaClient");

/**
 * Notification Repository
 * Handles all database operations for Notifications
 */

const findById = async (id) => {
  return await prisma.notification.findUnique({
    where: { id: String(id) },
  });
};

const findMany = async ({
  organisationId,
  userId,
  unreadOnly = false,
  page = 1,
  limit = 30,
} = {}) => {
  const where = {};
  if (organisationId) where.organisation_id = Number(organisationId);
  if (userId) where.user_id = Number(userId);
  if (unreadOnly) where.unread = true;

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      skip,
      take,
      orderBy: { created_at: "desc" },
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({
      where: {
        ...where,
        unread: true,
      },
    }),
  ]);

  return {
    notifications,
    total,
    unreadCount,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / limit),
  };
};

const create = async (notificationData) => {
  return await prisma.notification.create({
    data: {
      organisation_id: Number(notificationData.organisation_id),
      user_id: notificationData.user_id ? Number(notificationData.user_id) : null,
      title: notificationData.title,
      message: notificationData.message || null,
      description: notificationData.description || null,
      type: notificationData.type || "INFO",
      category: notificationData.category || null,
      link: notificationData.link || null,
      priority: notificationData.priority || "NORMAL",
      related_document: notificationData.related_document || null,
      unread: true,
      read: false,
    },
  });
};

const markAsRead = async (id) => {
  return await prisma.notification.update({
    where: { id: String(id) },
    data: { unread: false, read: true },
  });
};

const markAllAsRead = async (organisationId, userId = null) => {
  const where = { organisation_id: Number(organisationId) };
  if (userId) where.user_id = Number(userId);

  return await prisma.notification.updateMany({
    where,
    data: { unread: false, read: true },
  });
};

const deleteNotification = async (id) => {
  return await prisma.notification.delete({
    where: { id: String(id) },
  });
};

module.exports = {
  findById,
  findMany,
  create,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
