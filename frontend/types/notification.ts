export interface NotificationItem {
  id: string | number;
  title: string;
  message?: string;
  type?: "INFO" | "WARNING" | "SUCCESS" | "ALERT" | string;
  category?: string;
  unread?: boolean;
  isRead?: boolean;
  time?: string;
  createdAt?: string;
  link?: string;
}

export interface NotificationPreferences {
  emailAlerts?: boolean;
  browserNotifications?: boolean;
  taskAssignments?: boolean;
  approvalUpdates?: boolean;
  weeklyDigest?: boolean;
  [key: string]: any;
}
