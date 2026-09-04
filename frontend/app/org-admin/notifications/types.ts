export type NotificationItem = {
  id: string;
  title: string;
  message?: string;
  description?: string;
  type?: string;
  related_document?: string;
  priority?: "HIGH" | "MEDIUM" | "NORMAL" | "CRITICAL" | string;
  created_at: string;
  read: boolean;
  link?: string;
};

export type NotificationCounts = {
  all: number;
  unread: number;
  approvals: number;
  documents: number;
  system: number;
};
