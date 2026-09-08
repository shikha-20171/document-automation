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
  supportsFunctionCalling?: boolean;
  status: "ACTIVE" | "INACTIVE" | "DEPRECATED";
  isDefault: boolean;
}

export interface AIProviderItem {
  id: string;
  providerName: string;
  providerCode: string;
  providerType?: string;
  description: string | null;
  baseUrl: string | null;
  apiVersion: string | null;
  defaultModel?: string;
  apiKeyStatus?: "Configured" | "Not Configured";
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
  lastConnectionTest?: string | null;
  lastTestStatus?: string | null;
  lastTestedAt?: string | null;
  lastError?: string | null;
  lastUsed?: string | null;
  lastConnectedAt?: string | null;
  createdDate?: string;
  createdAt?: string;
  updatedAt?: string;
  models: AIProviderModel[];
}

export interface AIRoutingConfig {
  id?: string;
  primaryProviderCode: string;
  primaryModel: string;
  fallbackProviderCode: string | null;
  fallbackModel: string | null;
  routingEnabled: boolean;
  updatedBy?: string | null;
  updatedAt?: string;
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
  averageLatencyMs?: number;
  totalTokenUsage: number;
  aiCostUsd: number;
  totalCostUsd?: number;
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

export interface TestConnectionResult {
  success: boolean;
  status: string;
  provider: string;
  modelTested: string;
  responseTimeMs: number;
  testedAt: string;
  message: string;
  errorCategory?: string | null;
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

  getProvider: async (id: string): Promise<ApiResponse<AIProviderItem>> => {
    const { data } = await api.get<ApiResponse<AIProviderItem>>(`/super-admin/ai/providers/${id}`);
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

  activateProvider: async (id: string): Promise<ApiResponse<AIProviderItem>> => {
    const { data } = await api.post<ApiResponse<AIProviderItem>>(`/super-admin/ai/providers/${id}/activate`);
    return data;
  },

  deactivateProvider: async (id: string, reason?: string): Promise<ApiResponse<AIProviderItem>> => {
    const { data } = await api.post<ApiResponse<AIProviderItem>>(`/super-admin/ai/providers/${id}/deactivate`, { reason });
    return data;
  },

  toggleProvider: async (id: string, enabled: boolean): Promise<ApiResponse<AIProviderItem>> => {
    const { data } = await api.put<ApiResponse<AIProviderItem>>(`/super-admin/ai/providers/${id}/toggle`, { enabled });
    return data;
  },

  testProvider: async (id: string, payload?: { model?: string }): Promise<ApiResponse<TestConnectionResult>> => {
    const { data } = await api.post<ApiResponse<TestConnectionResult>>(`/super-admin/ai/providers/${id}/test`, payload || {});
    return data;
  },

  syncModels: async (id: string): Promise<ApiResponse<AIProviderModel[]>> => {
    const { data } = await api.post<ApiResponse<AIProviderModel[]>>(`/super-admin/ai/providers/${id}/models/sync`);
    return data;
  },

  deleteProvider: async (id: string): Promise<ApiResponse<any>> => {
    const { data } = await api.delete<ApiResponse<any>>(`/super-admin/ai/providers/${id}`);
    return data;
  },

  getRoutingConfig: async (): Promise<ApiResponse<AIRoutingConfig>> => {
    const { data } = await api.get<ApiResponse<AIRoutingConfig>>("/super-admin/ai/routing");
    return data;
  },

  updateRoutingConfig: async (payload: Partial<AIRoutingConfig>): Promise<ApiResponse<AIRoutingConfig>> => {
    const { data } = await api.put<ApiResponse<AIRoutingConfig>>("/super-admin/ai/routing", payload);
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

  // ─── OCR Management Endpoints ──────────────────────────────────────────
  getOcrConfig: async (): Promise<ApiResponse<OCRFullConfigResponse>> => {
    const { data } = await api.get<ApiResponse<OCRFullConfigResponse>>("/super-admin/ai/ocr");
    return data;
  },

  updateOcrRoutingConfig: async (payload: Partial<OCRRoutingConfig>): Promise<ApiResponse<OCRRoutingConfig>> => {
    const { data } = await api.put<ApiResponse<OCRRoutingConfig>>("/super-admin/ai/ocr/config", payload);
    return data;
  },

  testTesseract: async (settings: any = {}): Promise<ApiResponse<TesseractTestResult>> => {
    const { data } = await api.post<ApiResponse<TesseractTestResult>>("/super-admin/ai/ocr/test/tesseract", settings);
    return data;
  },

  testGoogleDocumentAI: async (params: any = {}): Promise<ApiResponse<GoogleDocAITestResult>> => {
    const { data } = await api.post<ApiResponse<GoogleDocAITestResult>>("/super-admin/ai/ocr/test/google-document-ai", params);
    return data;
  },

  configureGoogleDocumentAI: async (payload: {
    projectId: string;
    location: string;
    processorId: string;
    processorType: string;
    credentials?: string;
  }): Promise<ApiResponse<any>> => {
    const { data } = await api.post<ApiResponse<any>>("/super-admin/ai/ocr/google/configure", payload);
    return data;
  },

  activateGoogleDocumentAI: async (): Promise<ApiResponse<any>> => {
    const { data } = await api.post<ApiResponse<any>>("/super-admin/ai/ocr/google/activate");
    return data;
  },

  deactivateGoogleDocumentAI: async (): Promise<ApiResponse<any>> => {
    const { data } = await api.post<ApiResponse<any>>("/super-admin/ai/ocr/google/deactivate");
    return data;
  },

  setDefaultOcrEngine: async (engineCode: string): Promise<ApiResponse<any>> => {
    const { data } = await api.put<ApiResponse<any>>("/super-admin/ai/ocr/default-engine", { defaultEngine: engineCode });
    return data;
  },

  getIntegratedOcrHealth: async (): Promise<ApiResponse<any>> => {
    const { data } = await api.get<ApiResponse<any>>("/super-admin/ai/ocr/health");
    return data;
  },
};

export interface OCRRoutingConfig {
  id?: string;
  primaryEngineCode: "TESSERACT" | "GOOGLE_DOCUMENT_AI";
  fallbackEngineCode?: "TESSERACT" | "GOOGLE_DOCUMENT_AI" | null;
  fallbackEnabled: boolean;
  defaultLanguage: string;
  autoRotate: boolean;
  deskew: boolean;
  denoise: boolean;
  enhanceImage: boolean;
  confidenceThreshold: number;
  layoutDetection: boolean;
  tableDetection: boolean;
  updatedBy?: string | null;
  updatedAt?: string;
}

export interface TesseractStatus {
  installed: boolean;
  isNative: boolean;
  version: string;
  status: "Active" | "Unavailable";
  executablePath: string;
  availableLanguages: string[];
  lastHealthCheck?: string | null;
  lastProcessingTimeMs?: number | null;
  defaultLanguage: string;
  autoRotate: boolean;
  deskew: boolean;
  denoise: boolean;
  enhanceImage: boolean;
  confidenceThreshold: number;
  layoutDetection: boolean;
  tableDetection: boolean;
}

export interface GoogleDocAIStatus {
  id?: string;
  providerName: string;
  providerCode: string;
  status: "ACTIVE" | "INACTIVE" | "MAINTENANCE";
  connectionStatus: "CONNECTED" | "DISCONNECTED" | "FAILED" | "TESTING";
  projectId: string;
  location: string;
  processorId: string;
  processorType: string;
  isConfigured: boolean;
  credentialsMasked: string;
  lastTestedAt?: string | null;
  lastTestStatus?: string | null;
  lastError?: string | null;
  lastUsedAt?: string | null;
}

export interface OCRFullConfigResponse {
  tesseract: TesseractStatus;
  googleDocumentAI: GoogleDocAIStatus;
  routing: OCRRoutingConfig;
}

export interface TesseractTestResult {
  success: boolean;
  status: string;
  engine: string;
  version: string;
  testedLanguage: string;
  latencyMs: number;
  testedAt: string;
  confidence: number;
  recognizedText: string;
  message: string;
}

export interface GoogleDocAITestResult {
  success: boolean;
  status: string;
  provider: string;
  project?: string;
  location?: string;
  processor?: string;
  processorDisplayName?: string;
  processorType?: string;
  processorState?: string;
  errorCategory?: string;
  message: string;
  responseTimeMs: number;
  testedAt: string;
}

export default superAdminAiApi;
