import api, { type ApiResponse } from "./api";

export const analyticsApi = {
  getOverview: async (): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>("/org-admin/analytics/overview");
    return data;
  },

  getDocumentAnalytics: async (): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>("/org-admin/analytics/documents");
    return data;
  },

  getAiAnalytics: async (): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>("/org-admin/analytics/ai");
    return data;
  },

  getTeamAnalytics: async (): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>("/org-admin/analytics/team");
    return data;
  },

  getStorageAnalytics: async (): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>("/org-admin/analytics/storage");
    return data;
  },
};

export const orgAnalyticsApi = analyticsApi;
export default analyticsApi;
