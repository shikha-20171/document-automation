export interface AIModelOption {
  id: string;
  name: string;
  isDefault?: boolean;
}

export interface AIProviderOption {
  provider: "gemini" | "openai" | "anthropic" | string;
  displayName: string;
  isAllowed: boolean;
  isDefault?: boolean;
  models: AIModelOption[];
  requiredPlan?: string;
}

export interface AIChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  provider?: {
    id: string;
    name: string;
  };
  model?: {
    id: string;
    name: string;
  };
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  latencyMs?: number;
  attachmentName?: string | null;
  attachmentUrl?: string | null;
  createdAt: string;
}

export interface AIConversation {
  id: string;
  title: string;
  department?: string;
  team?: string;
  messageCount?: number;
  lastMessage?: string;
  messages?: AIChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface AISaveDocumentRequest {
  title?: string;
  documentTitle?: string;
  content: string;
  documentType?: string;
  type?: string;
  departmentId?: string | number;
  departmentName?: string;
  teamId?: string | number;
  teamName?: string;
  folder?: string;
  tags?: string[];
  status?: "DRAFT" | "ACTIVE" | "PENDING_APPROVAL";
  aiMetadata?: {
    provider?: string;
    model?: string;
    feature?: string;
    conversationId?: string;
    messageId?: string;
    prompt?: string;
  };
}

export interface AIModel {
  id?: string;
  providerId?: string;
  modelName: string;
  modelCode: string;
  description?: string;
  contextWindow?: number | string;
  maxOutputTokens?: number;
  inputCostPer1K?: number;
  outputCostPer1K?: number;
  supportsStreaming?: boolean;
  supportsVision?: boolean;
  supportsJSONMode?: boolean;
  isDefault?: boolean;
  status?: "ACTIVE" | "INACTIVE" | string;
}

export interface AIProvider {
  id: string;
  providerName: string;
  providerCode: "openai" | "gemini" | "anthropic" | string;
  description?: string;
  baseUrl?: string;
  apiVersion?: string;
  apiKeyMasked?: string;
  hasCredentials?: boolean;
  status: "ACTIVE" | "INACTIVE" | string;
  connectionStatus: "CONNECTED" | "DISCONNECTED" | "FAILED" | string;
  priority?: number;
  isDefault?: boolean;
  supportsChat?: boolean;
  supportsVision?: boolean;
  supportsOCR?: boolean;
  healthScore?: number;
  lastConnectedAt?: string;
  lastHealthCheckAt?: string;
  modelsCount?: number;
  models?: AIModel[];
  enabledPlansCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AIProviderConfig {
  apiKey?: string;
  defaultModel?: string;
  baseUrl?: string;
  apiVersion?: string;
  status?: "ACTIVE" | "INACTIVE";
}

export interface AILog {
  id: string;
  logCode: string;
  organisationId: string;
  userId?: string | null;
  provider?: { providerName: string; providerCode: string };
  model?: { modelName: string; modelCode: string };
  promptType: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number | string;
  latencyMs: number;
  requestStatus: "SUCCESS" | "FAILED" | "TIMEOUT";
  errorMessage?: string | null;
  createdAt: string;
}

export interface AICost {
  id: string;
  organisationId: string;
  providerId: string;
  modelId: string;
  provider?: { providerName: string; providerCode: string };
  model?: { modelName: string; modelCode: string };
  billingDate: string;
  requestCount: number;
  totalTokens: number | string;
  totalCost: number | string;
  currency: string;
}

export interface AIHealth {
  id: string;
  providerId: string;
  provider?: { providerName: string; providerCode: string };
  uptimePercent?: number | string;
  averageLatencyMs?: number;
  errorRate?: number | string;
  requestsToday?: number;
  failedRequests?: number;
  status: "OPERATIONAL" | "DEGRADED" | "DOWN" | "MAINTENANCE" | string;
  lastCheckedAt: string;
}

export interface AIJob {
  id: string;
  jobCode: string;
  organisationId: string;
  provider?: { providerName: string };
  model?: { modelName: string };
  requestType: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | string;
  status: "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED" | string;
  processingTimeMs?: number;
  errorMessage?: string;
  createdAt: string;
}

export interface AIEntitlement {
  organisationId: number;
  planName: string;
  status: string;
  monthlyQuota: number;
  usedRequests: number;
  remainingRequests: number;
  usagePercent: number;
  estimatedCostMonth: number;
  allowedProviders: {
    providerCode: string;
    providerName: string;
    isAllowedByPlan: boolean;
    isConfiguredOnPlatform: boolean;
    status: "AVAILABLE" | "UNCONFIGURED" | string;
    models: { modelCode: string; modelName: string }[];
  }[];
  allProviders: {
    providerCode: string;
    providerName: string;
    isAllowedByPlan: boolean;
    isConfiguredOnPlatform: boolean;
    status: "AVAILABLE" | "PLATFORM_UNCONFIGURED" | "UPGRADE_REQUIRED" | string;
    requiredPlan: string;
  }[];
  allowedModels: string[];
  features: string[];
}

export interface AiRunPayload {
  tool: string;
  content?: string;
  prompt?: string;
  mode?: string;
  fileName?: string;
  docId?: string;
  targetLanguage?: string;
  provider?: string;
  model?: string;
  options?: Record<string, any>;
}

export interface AiSummarizePayload {
  text?: string;
  documentId?: string | number;
  length?: "short" | "detailed" | string;
  type?: "short" | "detailed" | string;
  includeKeyPoints?: boolean;
  includeActionItems?: boolean;
  provider?: string;
  model?: string;
  file?: File | null;
}

export interface AiExtractPayload {
  content?: string;
  documentText?: string;
  documentName?: string;
  extractionType?: string;
  customFields?: any;
  provider?: string;
  model?: string;
  file?: File | null;
}

export interface AiClassifyPayload {
  content?: string;
  documentName?: string;
  categories?: string[];
  provider?: string;
  model?: string;
  file?: File | null;
}

export interface AiOcrPayload {
  scannedContent?: string;
  fileName?: string;
  language?: string;
  provider?: string;
  model?: string;
  file?: File | null;
}
