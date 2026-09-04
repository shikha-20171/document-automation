export interface DashboardStats {
  [key: string]: any;
}

export interface RecentActivityItem {
  id: string | number;
  title: string;
  meta?: string;
  time?: string;
  type?: string;
  status?: string;
  user?: string;
}

export interface QuickActionItem {
  label: string;
  action: string;
  link: string;
  icon?: string;
  primary?: boolean;
}

export interface EmployeeDashboardData {
  employee: {
    name: string;
    email: string;
    team: string;
    department: string;
    role: string;
    date: string;
  };
  stats: Record<string, number>;
  recentDocuments: any[];
  recentActivity: RecentActivityItem[];
  notifications: any[];
  quickActions: QuickActionItem[];
}
