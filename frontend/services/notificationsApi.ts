import api, { type ApiResponse } from "./api";
import type { NotificationPreferences } from "./types/notification";

export const notificationsApi = {
  /** Get notification list */
  getNotifications: async (params?: Record<string, any>, basePath = "/employee/notifications"): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>(basePath, { params });
    return data;
  },

  /** Mark single notification as read */
  markNotificationRead: async (id: string | number, basePath = "/employee/notifications"): Promise<ApiResponse> => {
    const { data } = await api.patch<ApiResponse>(`${basePath}/${id}/read`);
    return data;
  },

  /** Mark single notification as unread */
  markNotificationUnread: async (id: string | number): Promise<ApiResponse> => {
    const { data } = await api.patch<ApiResponse>(`/department-manager/notifications/${id}/unread`);
    return data;
  },

  /** Mark all notifications as read */
  markAllNotificationsRead: async (basePath = "/department-manager/notifications"): Promise<ApiResponse> => {
    const { data } = await api.patch<ApiResponse>(`${basePath}/read-all`);
    return data;
  },

  /** Delete a notification */
  deleteNotification: async (id: string | number, basePath = "/department-manager/notifications"): Promise<ApiResponse> => {
    const { data } = await api.delete<ApiResponse>(`${basePath}/${id}`);
    return data;
  },

  /** Update notification alert preferences */
  updateNotificationPreferences: async (prefs: NotificationPreferences): Promise<ApiResponse> => {
    const { data } = await api.put<ApiResponse>("/employee/notifications/preferences", prefs);
    return data;
  },
};

export default notificationsApi;
