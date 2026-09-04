const { notificationRepository } = require("../repositories");

/**
 * Notification Service
 * Handles user and organisation notification dispatch and tracking
 */

const notificationService = {
  /**
   * Get notifications with pagination and unread counts
   */
  async getNotifications(params) {
    return await notificationRepository.findMany(params);
  },

  /**
   * Create a new notification
   */
  async sendNotification(notificationData) {
    if (!notificationData.title || !notificationData.organisation_id) {
      throw new Error("Notification title and organisation ID are required.");
    }

    return await notificationRepository.create(notificationData);
  },

  /**
   * Mark single notification as read
   */
  async markAsRead(id) {
    const existing = await notificationRepository.findById(id);
    if (!existing) {
      throw new Error("Notification not found.");
    }

    return await notificationRepository.markAsRead(id);
  },

  /**
   * Mark all notifications as read for user or organisation
   */
  async markAllAsRead(organisationId, userId = null) {
    return await notificationRepository.markAllAsRead(organisationId, userId);
  },

  /**
   * Delete notification
   */
  async deleteNotification(id) {
    const existing = await notificationRepository.findById(id);
    if (!existing) {
      throw new Error("Notification not found.");
    }

    await notificationRepository.deleteNotification(id);

    return {
      success: true,
      message: "Notification deleted successfully.",
    };
  },
};

module.exports = notificationService;
