import api, { type ApiResponse } from "./api";

export interface OCRProviderItem {
  id: string;
  providerName: string;
  providerCode: string;
  description: string | null;
  apiEndpoint: string | null;
  authType: string;
  region: string | null;
  credentialsMasked?: string;
  hasCredentials: boolean;
  status: "ACTIVE" | "INACTIVE" | "MAINTENANCE";
  connectionStatus: "CONNECTED" | "DISCONNECTED" | "FAILED" | "TESTING";
  priority: number;
  isEnabled: boolean;
  isDefault: boolean;
  supportedFormats: string[];
  profilesCount?: number;
  serviceHealth?: any;
}

export interface OCRProfileItem {
  id: string;
  profileName: string;
  profileCode: string;
  description: string | null;
  providerId: string | null;
  providerName?: string;
  language: string;
  inputFormats: string[];
  textDetection: boolean;
  tableDetection: boolean;
  layoutDetection: boolean;
  handwritingDetection: boolean;
  confidenceThreshold: number;
  outputFormat: "PLAIN_TEXT" | "STRUCTURED_JSON" | "LAYOUT_DATA" | "TABLES";
  status: "ACTIVE" | "INACTIVE";
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface OCRJobItem {
  id: string;
  jobCode: string;
  organisationId: string;
  userId: string | null;
  documentId: string | null;
  documentName: string | null;
  providerId: string | null;
  profileId: string | null;
  language: string | null;
  pages: number;
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED" | "RETRYING" | "CANCELLED";
  confidenceScore: number | null;
  processingTimeMs: number | null;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  provider?: { providerName: string; providerCode: string };
  profile?: { profileName: string; profileCode: string };
}

export interface OCRLogItem {
  id: string;
  timestamp: string;
  ocrJobId: string;
  organisation: string;
  user: string;
  document: string;
  provider: string;
  profile: string;
  pages: number;
  status: string;
  processingTime: string;
  confidence: string;
  error: string | null;
}

export interface OCROverviewData {
  totalOcrRequests: number;
  documentsProcessed: number;
  pagesProcessed: number;
  averageConfidenceScore: number;
  averageProcessingTimeMs: number;
  totalOcrCostUsd: number;
  successRate: number;
  charts: {
    requestsOverTime: Array<{ date: string; requests: number; pages: number; cost: number; failed: number }>;
    requestsByProvider: Array<{ name: string; value: number }>;
    requestsByProfile: Array<{ name: string; value: number }>;
    pagesProcessedOverTime: Array<{ date: string; pages: number }>;
    costOverTime: Array<{ date: string; cost: number }>;
    failureRateOverTime: Array<{ date: string; failureRate: number }>;
  };
}

export interface OCRHealthItem {
  id: string;
  providerName: string;
  providerCode: string;
  status: string;
  connectionStatus: string;
  apiAvailability: string;
  responseTime: string;
  errorRate: string;
  rateLimitStatus: string;
  overallHealth: "Healthy" | "Warning" | "Inactive" | "Down";
  lastCheckedAt: string;
}

export const superAdminOcrApi = {
  getOverview: async (): Promise<ApiResponse<OCROverviewData>> => {
    const { data } = await api.get<ApiResponse<OCROverviewData>>("/super-admin/ocr/overview");
    return data;
  },

  getProviders: async (): Promise<ApiResponse<OCRProviderItem[]>> => {
    const { data } = await api.get<ApiResponse<OCRProviderItem[]>>("/super-admin/ocr/providers");
    return data;
  },

  createProvider: async (payload: any): Promise<ApiResponse<OCRProviderItem>> => {
    const { data } = await api.post<ApiResponse<OCRProviderItem>>("/super-admin/ocr/providers", payload);
    return data;
  },

  updateProvider: async (id: string, payload: any): Promise<ApiResponse<OCRProviderItem>> => {
    const { data } = await api.put<ApiResponse<OCRProviderItem>>(`/super-admin/ocr/providers/${id}`, payload);
    return data;
  },

  toggleProvider: async (id: string, enabled: boolean): Promise<ApiResponse<OCRProviderItem>> => {
    const { data } = await api.put<ApiResponse<OCRProviderItem>>(`/super-admin/ocr/providers/${id}/toggle`, { enabled });
    return data;
  },

  testProvider: async (id: string): Promise<ApiResponse<any>> => {
    const { data } = await api.post<ApiResponse<any>>(`/super-admin/ocr/providers/${id}/test`);
    return data;
  },

  deleteProvider: async (id: string): Promise<ApiResponse<any>> => {
    const { data } = await api.delete<ApiResponse<any>>(`/super-admin/ocr/providers/${id}`);
    return data;
  },

  getProfiles: async (providerId?: string): Promise<ApiResponse<OCRProfileItem[]>> => {
    const { data } = await api.get<ApiResponse<OCRProfileItem[]>>("/super-admin/ocr/profiles", {
      params: { providerId },
    });
    return data;
  },

  createProfile: async (payload: any): Promise<ApiResponse<OCRProfileItem>> => {
    const { data } = await api.post<ApiResponse<OCRProfileItem>>("/super-admin/ocr/profiles", payload);
    return data;
  },

  updateProfile: async (id: string, payload: any): Promise<ApiResponse<OCRProfileItem>> => {
    const { data } = await api.put<ApiResponse<OCRProfileItem>>(`/super-admin/ocr/profiles/${id}`, payload);
    return data;
  },

  toggleProfile: async (id: string, enabled: boolean): Promise<ApiResponse<OCRProfileItem>> => {
    const { data } = await api.put<ApiResponse<OCRProfileItem>>(`/super-admin/ocr/profiles/${id}/toggle`, { enabled });
    return data;
  },

  deleteProfile: async (id: string): Promise<ApiResponse<any>> => {
    const { data } = await api.delete<ApiResponse<any>>(`/super-admin/ocr/profiles/${id}`);
    return data;
  },

  getJobs: async (params?: any): Promise<ApiResponse<OCRJobItem[]>> => {
    const { data } = await api.get<ApiResponse<OCRJobItem[]>>("/super-admin/ocr/jobs", { params });
    return data;
  },

  retryJob: async (id: string): Promise<ApiResponse<any>> => {
    const { data } = await api.post<ApiResponse<any>>(`/super-admin/ocr/jobs/${id}/retry`);
    return data;
  },

  reprocessJob: async (id: string): Promise<ApiResponse<any>> => {
    const { data } = await api.post<ApiResponse<any>>(`/super-admin/ocr/jobs/${id}/reprocess`);
    return data;
  },

  cancelJob: async (id: string): Promise<ApiResponse<any>> => {
    const { data } = await api.post<ApiResponse<any>>(`/super-admin/ocr/jobs/${id}/cancel`);
    return data;
  },

  getUsage: async (): Promise<ApiResponse<any>> => {
    const { data } = await api.get<ApiResponse<any>>("/super-admin/ocr/usage");
    return data;
  },

  getCosts: async (): Promise<ApiResponse<any>> => {
    const { data } = await api.get<ApiResponse<any>>("/super-admin/ocr/costs");
    return data;
  },

  getLogs: async (params?: any): Promise<ApiResponse<OCRLogItem[]>> => {
    const { data } = await api.get<ApiResponse<OCRLogItem[]>>("/super-admin/ocr/logs", { params });
    return data;
  },

  getHealth: async (): Promise<ApiResponse<{ ocrQueueStatus: string; activeQueueJobs: number; providers: OCRHealthItem[] }>> => {
    const { data } = await api.get<ApiResponse<any>>("/super-admin/ocr/health");
    return data;
  },

  testAllHealth: async (): Promise<ApiResponse<any[]>> => {
    const { data } = await api.post<ApiResponse<any[]>>("/super-admin/ocr/health/test-all");
    return data;
  },
};

export default superAdminOcrApi;
