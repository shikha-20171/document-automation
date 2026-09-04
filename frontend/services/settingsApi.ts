import api, { type ApiResponse } from "./api";

export const settingsApi = {
  // ─── Org Admin Settings ───────────────────────────────────────────────────────
  getSettings: async (): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>("/org-admin/settings");
    return data;
  },

  updateProfile: async (profileData: any): Promise<ApiResponse> => {
    const { data } = await api.put<ApiResponse>("/org-admin/settings/profile", profileData);
    return data;
  },

  updateAiSettings: async (aiData: any): Promise<ApiResponse> => {
    const { data } = await api.put<ApiResponse>("/org-admin/settings/ai", aiData);
    return data;
  },

  updateBranding: async (brandingData: { primaryColor?: string; organisationName?: string }): Promise<ApiResponse> => {
    const { data } = await api.put<ApiResponse>("/org-admin/settings/branding", brandingData);
    return data;
  },

  updateDocumentSettings: async (docData: any): Promise<ApiResponse> => {
    const { data } = await api.put<ApiResponse>("/org-admin/settings/documents", docData);
    return data;
  },

  // ─── Super Admin Platform Settings ──────────────────────────────────────────
  getPlatformSettings: async (): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>("/super-admin/settings");
    return data;
  },

  updatePlatformSettings: async (payload: any): Promise<ApiResponse> => {
    const { data } = await api.put<ApiResponse>("/super-admin/settings", payload);
    return data;
  },
};

export const orgSettingsApi = settingsApi;
export default settingsApi;
