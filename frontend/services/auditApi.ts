import api, { type ApiResponse } from "./api";

export interface AuditLogItem {
  id: string;
  eventId: string;
  timestamp: string;
  timeFormatted: string;
  actor: {
    id: string | null;
    name: string;
    type: string;
  };
  module: string;
  category: string;
  action: string;
  resource: string;
  organisationId: string | null;
  organisationName: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  status: "SUCCESS" | "FAILED" | "PARTIAL";
  result: string;
  ipAddress: string;
  userAgent: string;
  browser: string;
  operatingSystem: string;
  location: string;
  details: string;
  changes: {
    oldValues: Record<string, any> | null;
    newValues: Record<string, any> | null;
  };
  requestId: string;
  metadata: Record<string, any>;
}

export interface AuditSummaryData {
  totalEvents: number;
  securityEvents: number;
  configChanges: number;
  failedActions: number;
  categories: Record<string, number>;
  recentAlerts: any[];
}

export interface AuditLogsResponse extends ApiResponse {
  logs: AuditLogItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasPrev: boolean;
    hasNext: boolean;
  };
}

export const auditApi = {
  /** Get platform audit logs with pagination and filters */
  getLogs: async (params?: Record<string, any>): Promise<AuditLogsResponse> => {
    const { data } = await api.get<AuditLogsResponse>("/super-admin/audit-logs", { params });
    return data;
  },

  /** Get KPI summary cards & metrics */
  getSummary: async (): Promise<ApiResponse<AuditSummaryData>> => {
    const { data } = await api.get<ApiResponse<AuditSummaryData>>("/super-admin/audit-logs/summary");
    return data;
  },

  /** Get single audit log detail by ID */
  getLogById: async (id: string): Promise<ApiResponse<AuditLogItem>> => {
    const { data } = await api.get<ApiResponse<AuditLogItem>>(`/super-admin/audit-logs/${id}`);
    return data;
  },

  /** Export audit logs as CSV or JSON */
  exportLogs: async (format: "csv" | "json" = "csv", params?: Record<string, any>): Promise<Blob> => {
    const response = await api.get("/super-admin/audit-logs/export", {
      params: { ...params, format },
      responseType: "blob",
    });
    return response.data;
  },

  /** Record a manual audit log */
  createLog: async (payload: any): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>("/super-admin/audit-logs", payload);
    return data;
  },
};

export default auditApi;
