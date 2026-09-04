const prisma = require("../config/prismaClient");

/**
 * Centralized Notification Dispatcher for all modules
 * Creates real-time in-app notifications in database for Org Admin, Department Manager, Team Leader, and Employee.
 */
const dispatchNotification = async ({
  organisationId,
  userId = null,
  title,
  message,
  type = "APPROVAL",
  priority = "HIGH",
  link = null,
  relatedDocument = null,
}) => {
  try {
    const orgId = parseInt(organisationId, 10) || 1;
    return await prisma.notification.create({
      data: {
        organisation_id: orgId,
        user_id: userId ? parseInt(userId, 10) : null,
        title,
        message,
        description: message,
        type,
        category: type,
        priority,
        link,
        related_document: relatedDocument,
        unread: true,
        read: false,
      },
    });
  } catch (err) {
    console.error("Failed to dispatch notification:", err.message);
    return null;
  }
};

module.exports = { dispatchNotification };
