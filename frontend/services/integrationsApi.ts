import api, { type ApiResponse } from "./api";

export interface IntegrationProviderMeta {
  id: string;
  name: string;
  slug: string;
  category: "STORAGE" | "COMMUNICATION" | "CRM" | "PRODUCTIVITY" | "E_SIGNATURE" | "AUTHENTICATION" | "DEVELOPER";
  description: string;
  authType: "OAUTH2" | "API_KEY" | "CUSTOM" | "HMAC_SHA256";
  icon?: string;
  status: "CONNECTED" | "DISCONNECTED" | "NOT_CONFIGURED" | "READY_TO_CONNECT" | "FAILED" | "CONFIG_REQUIRED";
  isConfigured: boolean;
  isPlatformAvailable?: boolean;
  platformNotice?: string | null;
  requiredEnv?: string[];
  actions: Array<{ id: string; name: string; description: string }>;
  setupGuide?: string;
  connectedRecord?: {
    id: string;
    accountName?: string;
    accountEmail?: string;
    connectedAt?: string;
    lastSyncedAt?: string;
    expiresAt?: string;
  } | null;
  logs?: Array<{
    id: string;
    action: string;
    status: string;
    executionTimeMs: number;
    errorMessage?: string;
    createdAt: string;
    externalId?: string;
  }>;
}

export interface ConfigField {
  key: string;
  label: string;
  type: "text" | "password" | "select" | "boolean" | "tags" | "readonly";
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  default?: any;
  options?: string[];
  copyable?: boolean;
}

export interface PlatformProviderMeta {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  authType: string;
  icon?: string;
  isEnabled: boolean;
  status: "ACTIVE" | "NOT_CONFIGURED" | "DISABLED";
  healthStatus: "HEALTHY" | "DEGRADED" | "DOWN";
  errorRate: number;
  connectedTenantsCount: number;
  clientIdMasked?: string | null;
  hasClientSecret?: boolean;
  redirectUri?: string | null;
  requiredEnv?: string[];
  configFields?: ConfigField[];
  settings?: any;
  setupGuide?: string;
}

export const integrationsApi = {
  // ─── Organisation Admin Methods (1-Click OAuth) ──────────────────────────
  getProvidersCatalog: async (): Promise<ApiResponse<IntegrationProviderMeta[]>> => {
    const { data } = await api.get<ApiResponse<IntegrationProviderMeta[]>>("/org-admin/integrations/providers");
    return data;
  },

  getIntegrations: async (): Promise<ApiResponse<IntegrationProviderMeta[]>> => {
    const { data } = await api.get<ApiResponse<IntegrationProviderMeta[]>>("/org-admin/integrations");
    return data;
  },

  getIntegrationById: async (providerId: string): Promise<ApiResponse<IntegrationProviderMeta>> => {
    const { data } = await api.get<ApiResponse<IntegrationProviderMeta>>(`/org-admin/integrations/${providerId}`);
    return data;
  },

  /** Initiate one-click OAuth or save credential configuration */
  connect: async (
    provider: string,
    payload: any = {}
  ): Promise<ApiResponse<{ requiresRedirect?: boolean; authUrl?: string; message?: string }>> => {
    const { data } = await api.post<ApiResponse<any>>(`/org-admin/integrations/${provider}/connect`, payload);
    return data;
  },

  testConnection: async (provider: string): Promise<ApiResponse<any>> => {
    const { data } = await api.post<ApiResponse<any>>(`/org-admin/integrations/${provider}/test`);
    return data;
  },

  executeAction: async (provider: string, action: string, payload: any = {}): Promise<ApiResponse<any>> => {
    const { data } = await api.post<ApiResponse<any>>(`/org-admin/integrations/${provider}/actions/${action}`, payload);
    return data;
  },

  disconnect: async (provider: string): Promise<ApiResponse<any>> => {
    const { data } = await api.post<ApiResponse<any>>(`/org-admin/integrations/${provider}/disconnect`);
    return data;
  },

  getLogs: async (provider: string): Promise<ApiResponse<any[]>> => {
    const { data } = await api.get<ApiResponse<any[]>>(`/org-admin/integrations/${provider}/logs`);
    return data;
  },

  // ─── Super Admin Platform Integration Management ─────────────────────────
  getPlatformIntegrations: async (): Promise<ApiResponse<PlatformProviderMeta[]>> => {
    const { data } = await api.get<ApiResponse<PlatformProviderMeta[]>>("/super-admin/platform-integrations");
    return data;
  },

  updatePlatformConfig: async (
    provider: string,
    config: {
      clientId?: string;
      clientSecret?: string;
      redirectUri?: string;
      tenantId?: string;
      allowedScopes?: string[];
      settings?: any;
      isEnabled?: boolean;
    }
  ): Promise<ApiResponse<any>> => {
    const { data } = await api.put<ApiResponse<any>>(`/super-admin/platform-integrations/${provider}/config`, config);
    return data;
  },

  togglePlatformIntegration: async (provider: string, isEnabled?: boolean): Promise<ApiResponse<any>> => {
    const { data } = await api.put<ApiResponse<any>>(`/super-admin/platform-integrations/${provider}/toggle`, { isEnabled });
    return data;
  },

  testPlatformIntegration: async (provider: string): Promise<ApiResponse<any>> => {
    const { data } = await api.post<ApiResponse<any>>(`/super-admin/platform-integrations/${provider}/test`);
    return data;
  },

  // ─── Webhooks ────────────────────────────────────────────────────────────
  getWebhooks: async (): Promise<ApiResponse<any[]>> => {
    const { data } = await api.get<ApiResponse<any[]>>("/org-admin/integrations/webhooks");
    return data;
  },

  createWebhook: async (webhookData: { name: string; url: string; events: string[] }): Promise<ApiResponse<any>> => {
    const { data } = await api.post<ApiResponse<any>>("/org-admin/integrations/webhooks", webhookData);
    return data;
  },

  deleteWebhook: async (id: string): Promise<ApiResponse<any>> => {
    const { data } = await api.delete<ApiResponse<any>>(`/org-admin/integrations/webhooks/${id}`);
    return data;
  },

  testWebhook: async (id: string): Promise<ApiResponse<any>> => {
    const { data } = await api.post<ApiResponse<any>>(`/org-admin/integrations/webhooks/${id}/test`);
    return data;
  },

  // ─── API Keys ────────────────────────────────────────────────────────────
  getApiKeys: async (): Promise<ApiResponse<any[]>> => {
    const { data } = await api.get<ApiResponse<any[]>>("/org-admin/integrations/api-keys");
    return data;
  },

  generateApiKey: async (name: string): Promise<ApiResponse<any>> => {
    const { data } = await api.post<ApiResponse<any>>("/org-admin/integrations/api-keys", { name });
    return data;
  },

  revokeApiKey: async (id: string): Promise<ApiResponse<any>> => {
    const { data } = await api.delete<ApiResponse<any>>(`/org-admin/integrations/api-keys/${id}`);
    return data;
  },
};

export default integrationsApi;
