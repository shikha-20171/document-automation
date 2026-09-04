import api, { type ApiResponse } from "./api";

export interface AIProviderModel {
  id: string;
  providerId: string;
  providerName?: string;
  providerCode?: string;
  modelName: string;
  modelCode: string;
  contextWindow: number;
  inputCostPer1K: number;
  outputCostPer1K: number;
  maxOutputTokens: number;
  supportsVision: boolean;
  supportsFunctionCalling: boolean;
  status: "ACTIVE" | "INACTIVE" | "DEPRECATED";
  isDefault: boolean;
}

export interface AIProviderItem {
  id: string;
  providerName: string;
  providerCode: string;
  description: string | null;
  baseUrl: string | null;
  apiVersion: string | null;
  apiKeyMasked?: string;
  hasApiKey: boolean;
  status: "ACTIVE" | "INACTIVE" | "MAINTENANCE";
  connectionStatus: "CONNECTED" | "DISCONNECTED" | "FAILED" | "TESTING";
  priority: number;
  isDefault: boolean;
  supportsChat: boolean;
  supportsVision: boolean;
  supportsOCR: boolean;
  supportsStreaming: boolean;
  healthScore?: number | null;
  lastConnectedAt?: string | null;
  models: AIProviderModel[];
}

export interface AICapabilityItem {
  id: string;
  name: string;
  code: string;
  description: string | null;
  defaultModel: string;
  fallbackModel: string | null;
  maxTokens: number;
  temperature: number;
  systemPrompt: string | null;
  status: "ACTIVE" | "INACTIVE";
  createdAt?: string;
  updatedAt?: string;
}

export interface AIJobItem {
  id: string;
  jobCode: string;
  organisationId: string;
  userId: string | null;
  documentId: string | null;
  requestType: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";
  retryCount: number;
  startedAt: string | null;
  completedAt: string | null;
  processingTimeMs: number | null;
  errorMessage: string | null;
  createdAt: string;
  provider?: { providerName: string; providerCode: string };
  model?: { modelName: string; modelCode: string };
}

export interface AILogItem {
  id: string;
  timestamp: string;
  requestId: string;
  organisation: string;
  user: string;
  provider: string;
  model: string;
  capability: string;
  status: "SUCCESS" | "FAILED" | "TIMEOUT";
  latency: string;
  tokenUsage: number;
  cost: number;
  error: string | null;
}

export interface AIOverviewData {
  totalAiRequests: number;
  successfulRequests: number;
  failedRequests: number;
  requestsToday: number;
  activeAiJobs: number;
  averageProcessingTimeMs: number;
  totalTokenUsage: number;
  aiCostUsd: number;
  successRate: number;
  failureRate: number;
  charts: {
    requestsOverTime: Array<{ date: string; requests: number; tokens: number; cost: number; failed: number }>;
    requestsByProvider: Array<{ name: string; value: number }>;
    requestsByModel: Array<{ name: string; value: number }>;
    tokenUsageOverTime: Array<{ date: string; tokens: number }>;
    costOverTime: Array<{ date: string; cost: number }>;
    failureRateOverTime: Array<{ date: string; failureRate: number }>;
  };
}

export interface AIHealthItem {
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
  models: Array<{
    modelName: string;
    modelCode: string;
    status: string;
    health: string;
  }>;
}

export const superAdminAiApi = {
  getOverview: async (): Promise<ApiResponse<AIOverviewData>> => {
    const { data } = await api.get<ApiResponse<AIOverviewData>>("/super-admin/ai/overview");
    return data;
  },

  getProviders: async (): Promise<ApiResponse<AIProviderItem[]>> => {
    const { data } = await api.get<ApiResponse<AIProviderItem[]>>("/super-admin/ai/providers");
    return data;
  },

  createProvider: async (payload: any): Promise<ApiResponse<AIProviderItem>> => {
    const { data } = await api.post<ApiResponse<AIProviderItem>>("/super-admin/ai/providers", payload);
    return data;
  },

  updateProvider: async (id: string, payload: any): Promise<ApiResponse<AIProviderItem>> => {
    const { data } = await api.put<ApiResponse<AIProviderItem>>(`/super-admin/ai/providers/${id}`, payload);
    return data;
  },

  toggleProvider: async (id: string, enabled: boolean): Promise<ApiResponse<AIProviderItem>> => {
    const { data } = await api.put<ApiResponse<AIProviderItem>>(`/super-admin/ai/providers/${id}/toggle`, { enabled });
    return data;
  },

  testProvider: async (id: string): Promise<ApiResponse<any>> => {
    const { data } = await api.post<ApiResponse<any>>(`/super-admin/ai/providers/${id}/test`);
    return data;
  },

  deleteProvider: async (id: string): Promise<ApiResponse<any>> => {
    const { data } = await api.delete<ApiResponse<any>>(`/super-admin/ai/providers/${id}`);
    return data;
  },

  getModels: async (providerId?: string): Promise<ApiResponse<AIProviderModel[]>> => {
    const { data } = await api.get<ApiResponse<AIProviderModel[]>>("/super-admin/ai/models", {
      params: { providerId },
    });
    return data;
  },

  createModel: async (payload: any): Promise<ApiResponse<AIProviderModel>> => {
    const { data } = await api.post<ApiResponse<AIProviderModel>>("/super-admin/ai/models", payload);
    return data;
  },

  updateModel: async (id: string, payload: any): Promise<ApiResponse<AIProviderModel>> => {
    const { data } = await api.put<ApiResponse<AIProviderModel>>(`/super-admin/ai/models/${id}`, payload);
    return data;
  },

  deleteModel: async (id: string): Promise<ApiResponse<any>> => {
    const { data } = await api.delete<ApiResponse<any>>(`/super-admin/ai/models/${id}`);
    return data;
  },

  getCapabilities: async (): Promise<ApiResponse<AICapabilityItem[]>> => {
    const { data } = await api.get<ApiResponse<AICapabilityItem[]>>("/super-admin/ai/capabilities");
    return data;
  },

  createCapability: async (payload: any): Promise<ApiResponse<AICapabilityItem>> => {
    const { data } = await api.post<ApiResponse<AICapabilityItem>>("/super-admin/ai/capabilities", payload);
    return data;
  },

  updateCapability: async (id: string, payload: any): Promise<ApiResponse<AICapabilityItem>> => {
    const { data } = await api.put<ApiResponse<AICapabilityItem>>(`/super-admin/ai/capabilities/${id}`, payload);
    return data;
  },

  toggleCapability: async (id: string, enabled: boolean): Promise<ApiResponse<AICapabilityItem>> => {
    const { data } = await api.put<ApiResponse<AICapabilityItem>>(`/super-admin/ai/capabilities/${id}/toggle`, { enabled });
    return data;
  },

  deleteCapability: async (id: string): Promise<ApiResponse<any>> => {
    const { data } = await api.delete<ApiResponse<any>>(`/super-admin/ai/capabilities/${id}`);
    return data;
  },

  getJobs: async (params?: any): Promise<ApiResponse<AIJobItem[]>> => {
    const { data } = await api.get<ApiResponse<AIJobItem[]>>("/super-admin/ai/jobs", { params });
    return data;
  },

  retryJob: async (id: string): Promise<ApiResponse<any>> => {
    const { data } = await api.post<ApiResponse<any>>(`/super-admin/ai/jobs/${id}/retry`);
    return data;
  },

  cancelJob: async (id: string): Promise<ApiResponse<any>> => {
    const { data } = await api.post<ApiResponse<any>>(`/super-admin/ai/jobs/${id}/cancel`);
    return data;
  },

  getUsage: async (): Promise<ApiResponse<any>> => {
    const { data } = await api.get<ApiResponse<any>>("/super-admin/ai/usage");
    return data;
  },

  getCosts: async (): Promise<ApiResponse<any>> => {
    const { data } = await api.get<ApiResponse<any>>("/super-admin/ai/costs");
    return data;
  },

  getLogs: async (params?: any): Promise<ApiResponse<AILogItem[]>> => {
    const { data } = await api.get<ApiResponse<AILogItem[]>>("/super-admin/ai/logs", { params });
    return data;
  },

  getHealth: async (): Promise<ApiResponse<{ aiQueueStatus: string; activeQueueJobs: number; providers: AIHealthItem[] }>> => {
    const { data } = await api.get<ApiResponse<any>>("/super-admin/ai/health");
    return data;
  },

  testAllHealth: async (): Promise<ApiResponse<any[]>> => {
    const { data } = await api.post<ApiResponse<any[]>>("/super-admin/ai/health/test-all");
    return data;
  },
};

export default superAdminAiApi;
