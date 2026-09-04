import api, { type ApiResponse } from "./api";
import type { CreateTemplatePayload, GenerateDocFromTemplatePayload } from "./types/template";

export const templatesApi = {
  // ─── 1. Template Library & CRUD ──────────────────────────────────────────────
  getTemplates: async (params?: Record<string, any>, basePath = "/employee/templates"): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>(basePath, { params });
    return data;
  },

  getTemplateById: async (id: string | number, basePath = "/employee/templates"): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>(`${basePath}/${id}`);
    return data;
  },

  createTemplate: async (payload: CreateTemplatePayload, basePath = "/employee/templates"): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>(basePath, payload);
    return data;
  },

  updateTemplate: async (id: string | number, payload: Partial<CreateTemplatePayload>, basePath = "/employee/templates"): Promise<ApiResponse> => {
    const method = basePath.includes("department-manager") ? "patch" : "put";
    const { data } = await api[method]<ApiResponse>(`${basePath}/${id}`, payload);
    return data;
  },

  duplicateTemplate: async (id: string | number, basePath = "/employee/templates"): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>(`${basePath}/${id}/duplicate`);
    return data;
  },

  deleteTemplate: async (id: string | number, basePath = "/employee/templates"): Promise<ApiResponse> => {
    const { data } = await api.delete<ApiResponse>(`${basePath}/${id}`);
    return data;
  },

  generateAiTemplate: async (payload: { prompt: string; category?: string }): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>("/employee/templates/generate-ai", payload);
    return data;
  },

  generateDocumentFromTemplate: async (
    templateId: string,
    fieldValues: Record<string, any>,
    docName?: string
  ): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>("/employee/templates/generate-document", {
      templateId,
      fieldValues,
      docName,
    });
    return data;
  },

  createTeamTemplate: async (payload: { name: string; type?: string; description?: string; fields?: string[] }): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>("/team-leader/templates/create-team-template", payload);
    return data;
  },

  createDocFromTemplate: async (payload: GenerateDocFromTemplatePayload): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>("/team-leader/templates/use-template", payload);
    return data;
  },

  togglePublish: async (id: string | number, status: string): Promise<ApiResponse> => {
    const { data } = await api.patch<ApiResponse>(`/org-admin/ai-builder/templates/${id}/publish`, { status });
    return data;
  },

  generateDocumentAi: async (payload: any): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>("/org-admin/ai-builder/generate", payload);
    return data;
  },
};

export const orgDocBuilderApi = {
  getTemplates: async (): Promise<ApiResponse> => {
    return templatesApi.getTemplates(undefined, "/org-admin/ai-builder/templates");
  },
  generateDocumentAi: async (payload: any): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>("/org-admin/ai-builder/generate", payload);
    return data;
  },
  transformDocumentAi: async (payload: {
    action: string;
    content: string;
    selectedText?: string;
    language?: string;
    tone?: string;
  }): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>("/org-admin/ai-builder/transform", payload);
    return data;
  },
  autosaveDocument: async (payload: any): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>("/org-admin/ai-builder/autosave", payload);
    return data;
  },
  submitDocument: async (payload: any): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>("/org-admin/ai-builder/submit", payload);
    return data;
  },
  getCrmRecipients: async (): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>("/org-admin/ai-builder/recipients");
    return data;
  },
  createTemplate: async (payload: any): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>("/org-admin/ai-builder/templates", payload);
    return data;
  },
  updateTemplate: async (id: string | number, payload: any): Promise<ApiResponse> => {
    const { data } = await api.put<ApiResponse>(`/org-admin/ai-builder/templates/${id}`, payload);
    return data;
  },
  deleteTemplate: async (id: string | number): Promise<ApiResponse> => {
    const { data } = await api.delete<ApiResponse>(`/org-admin/ai-builder/templates/${id}`);
    return data;
  },
  duplicateTemplate: async (id: string | number): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>(`/org-admin/ai-builder/templates/${id}/duplicate`);
    return data;
  },
  getVersions: async (id: string | number = "current"): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>(`/org-admin/ai-builder/templates/${id}/versions`);
    return data;
  },
  restoreVersion: async (version: number | string, id: string | number = "current"): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>(`/org-admin/ai-builder/templates/${id}/versions/${version}/restore`);
    return data;
  },
};
