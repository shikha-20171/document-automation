export type SuperAdminNotificationItem = {
  id: string;
  title: string;
  message?: string;
  description?: string;
  type?: string;
  category?: string;
  priority?: string;
  read?: boolean;
  unread?: boolean;
  created_at?: string;
  timestamp?: string;
  organisation?: {
    id?: number;
    name?: string;
  };
};

export type SuperAdminNotificationCounts = {
  all: number;
  unread: number;
  critical: number;
  system: number;
  billing: number;
  security: number;
};

export type BroadcastFormData = {
  title: string;
  message: string;
  targetAudience: string;
  priority: string;
};

export type ChannelSettingsData = {
  emailEnabled: boolean;
  inAppEnabled: boolean;
  slackWebhook: string;
  smsProvider: string;
  smtpStatus: string;
};
