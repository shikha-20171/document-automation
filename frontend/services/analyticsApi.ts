import api, { type ApiResponse } from "./api";

export interface AnalyticsFilterParams {
  dateRange?: string;
  startDate?: string;
  endDate?: string;
  departmentId?: string | number;
  branchId?: string | number;
  documentType?: string;
  userId?: string | number;
  status?: string;
  timeframe?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
  search?: string;
  reportType?: string;
  format?: string;
  groupBy?: string;
}

export const analyticsApi = {
  getFilterOptions: async (): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>("/org-admin/analytics/filters");
    return data;
  },

  getOverview: async (params?: AnalyticsFilterParams): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>("/org-admin/analytics/overview", { params });
    return data;
  },

  getActivity: async (params?: AnalyticsFilterParams): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>("/org-admin/analytics/activity", { params });
    return data;
  },

  getStatusDistribution: async (params?: AnalyticsFilterParams): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>("/org-admin/analytics/status-distribution", { params });
    return data;
  },

  getDocumentTypes: async (params?: AnalyticsFilterParams): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>("/org-admin/analytics/document-types", { params });
    return data;
  },

  getDocumentAnalytics: async (params?: AnalyticsFilterParams): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>("/org-admin/analytics/documents", { params });
    return data;
  },

  getAiAnalytics: async (params?: AnalyticsFilterParams): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>("/org-admin/analytics/ai", { params });
    return data;
  },

  getWorkflowAnalytics: async (params?: AnalyticsFilterParams): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>("/org-admin/analytics/workflow", { params });
    return data;
  },

  getApprovalAnalytics: async (params?: AnalyticsFilterParams): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>("/org-admin/analytics/approvals", { params });
    return data;
  },

  getDepartmentAnalytics: async (params?: AnalyticsFilterParams): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>("/org-admin/analytics/departments", { params });
    return data;
  },

  getBranchAnalytics: async (params?: AnalyticsFilterParams): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>("/org-admin/analytics/branches", { params });
    return data;
  },

  getUserAnalytics: async (params?: AnalyticsFilterParams): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>("/org-admin/analytics/users", { params });
    return data;
  },

  getTeamAnalytics: async (params?: AnalyticsFilterParams): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>("/org-admin/analytics/team", { params });
    return data;
  },

  getSignatureAnalytics: async (params?: AnalyticsFilterParams): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>("/org-admin/analytics/signatures", { params });
    return data;
  },

  getClientAnalytics: async (params?: AnalyticsFilterParams): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>("/org-admin/analytics/clients", { params });
    return data;
  },

  getBottlenecks: async (params?: AnalyticsFilterParams): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>("/org-admin/analytics/bottlenecks", { params });
    return data;
  },

  getRecentActivity: async (limit: number = 10): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>("/org-admin/analytics/recent-activity", { params: { limit } });
    return data;
  },

  getTopDocuments: async (limit: number = 6): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>("/org-admin/analytics/top-documents", { params: { limit } });
    return data;
  },

  getReportTable: async (params?: AnalyticsFilterParams): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>("/org-admin/analytics/report", { params });
    return data;
  },

  exportReport: async (params?: AnalyticsFilterParams): Promise<any> => {
    const response = await api.get("/org-admin/analytics/export", {
      params,
      responseType: params?.format?.toUpperCase() === "CSV" ? "blob" : "json",
    });
    return response.data;
  },

  getStorageAnalytics: async (): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>("/org-admin/analytics/storage");
    return data;
  },
};

export const orgAnalyticsApi = analyticsApi;
export default analyticsApi;
