import api, { type ApiResponse } from "./api";

export interface AuditLogItem {
  id: string;
  eventId: string;
  createdAt: string;
  timestamp: string;
  actorUserId?: string | null;
  actorName: string;
  actorRole: string;
  actorType?: string | null;
  organisationId?: string | null;
  organisationName: string;
  module?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  resourceName?: string | null;
  severity: "INFO" | "WARNING" | "CRITICAL";
  status: "SUCCESS" | "FAILED";
  ipAddress: string;
  userAgent?: string | null;
  browser?: string | null;
  operatingSystem?: string | null;
  location?: string | null;
  requestId?: string | null;
  beforeData?: any;
  afterData?: any;
  metadata?: any;
  retentionUntil?: string | null;
}

export interface AuditPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export interface AuditOverviewData {
  totalEvents: number;
  eventsToday: number;
  successfulEvents: number;
  failedEvents: number;
  securityEvents: number;
  criticalEvents: number;
  adminActions: number;
  charts: {
    eventsOverTime: Array<{ date: string; total: number; success: number; failed: number; security: number }>;
    eventsByAction: Array<{ action: string; count: number }>;
    eventsByOrganisation: Array<{ organisation: string; count: number }>;
    eventsByRole: Array<{ role: string; count: number }>;
    successVsFailed: { success: number; failed: number };
  };
}

export interface AuditFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  organisationId?: string;
  actorUserId?: string;
  role?: string;
  action?: string;
  resourceType?: string;
  severity?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export const superAdminAuditApi = {
  getOverview: async (): Promise<ApiResponse<AuditOverviewData>> => {
    const { data } = await api.get<ApiResponse<AuditOverviewData>>("/super-admin/audit-logs/overview");
    return data;
  },

  getLogs: async (params?: AuditFilterParams): Promise<ApiResponse<AuditLogItem[]>> => {
    const { data } = await api.get<ApiResponse<AuditLogItem[]>>("/super-admin/audit-logs", { params });
    return data;
  },

  getSecurityEvents: async (params?: AuditFilterParams): Promise<ApiResponse<AuditLogItem[]>> => {
    const { data } = await api.get<ApiResponse<AuditLogItem[]>>("/super-admin/audit-logs/security-events", { params });
    return data;
  },

  getAdminActions: async (params?: AuditFilterParams): Promise<ApiResponse<AuditLogItem[]>> => {
    const { data } = await api.get<ApiResponse<AuditLogItem[]>>("/super-admin/audit-logs/admin-actions", { params });
    return data;
  },

  getLogById: async (id: string): Promise<ApiResponse<AuditLogItem>> => {
    const { data } = await api.get<ApiResponse<AuditLogItem>>(`/super-admin/audit-logs/${id}`);
    return data;
  },

  exportLogs: async (params: AuditFilterParams = {}, format: "csv" | "json" = "csv"): Promise<Blob> => {
    const cleanParams: Record<string, any> = { format };
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "" && val !== "ALL") {
        cleanParams[key] = val;
      }
    });

    const response = await api.get("/super-admin/audit-logs/export", {
      params: cleanParams,
      responseType: "blob",
    });

    return response.data as Blob;
  },
};

export default superAdminAuditApi;
