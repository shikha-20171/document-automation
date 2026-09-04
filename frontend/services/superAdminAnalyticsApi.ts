import api, { type ApiResponse } from "./api";

export interface PlatformAnalyticsData {
  summary: {
    totalOrganisations: number;
    activeOrganisations: number;
    totalUsers: number;
    totalDocuments: number;
    totalAiOperations: number;
    systemStatus: string;
  };
  documentGrowth: Array<{ month: string; documents: number; aiProcessed: number }>;
  recentOrganisations: Array<{
    id: number;
    name: string;
    plan: string;
    usersCount: number;
    documentsCount: number;
    status: string;
    createdAt: string;
  }>;
}

export interface OrgUsageAnalytics {
  id: number;
  name: string;
  plan: string;
  usersCount: number;
  documentsProcessed: number;
  storageUsedMb: number;
  aiTokensUsed: number;
  ocrPagesProcessed: number;
  status: string;
}

export const superAdminAnalyticsApi = {
  getPlatformAnalytics: async (): Promise<ApiResponse<PlatformAnalyticsData>> => {
    const { data } = await api.get<ApiResponse<PlatformAnalyticsData>>("/super-admin/analytics/platform");
    return data;
  },

  getOrganisationAnalytics: async (): Promise<ApiResponse<OrgUsageAnalytics[]>> => {
    const { data } = await api.get<ApiResponse<OrgUsageAnalytics[]>>("/super-admin/analytics/organisations");
    return data;
  },

  getAiAnalytics: async (): Promise<ApiResponse<any>> => {
    const { data } = await api.get<ApiResponse<any>>("/super-admin/analytics/ai");
    return data;
  },

  getOcrAnalytics: async (): Promise<ApiResponse<any>> => {
    const { data } = await api.get<ApiResponse<any>>("/super-admin/analytics/ocr");
    return data;
  },
};

export default superAdminAnalyticsApi;
