import api, { type ApiResponse } from "./api";

export const documentVersionsApi = {
  /** Get version history for a template or document */
  getVersions: async (templateId: string): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>(`/org-admin/ai-builder/templates/${templateId}/versions`);
    return data;
  },

  /** Restore a specific version */
  restoreVersion: async (templateId: string, version: number | string): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>(`/org-admin/ai-builder/templates/${templateId}/versions/${version}/restore`);
    return data;
  },
};

export default documentVersionsApi;
