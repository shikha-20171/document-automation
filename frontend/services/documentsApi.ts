import api, { type ApiResponse } from "./api";
import type { CreateDocumentPayload, DocumentFilters } from "./types/document";

export const documentsApi = {
  // ─── 1. General & Employee Documents ──────────────────────────────────────────
  /** Get documents list with search, category, status, and archive filters */
  getDocuments: async (params?: DocumentFilters, basePath = "/employee/documents"): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>(basePath, { params });
    return data;
  },

  /** Get single document details with content and history */
  getDocumentById: async (id: string | number, basePath = "/employee/documents"): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>(`${basePath}/${id}`);
    return data;
  },

  /** Create a new document with optional file upload */
  createDocument: async (payload: CreateDocumentPayload, basePath = "/employee/documents"): Promise<ApiResponse> => {
    if (payload.file) {
      const formData = new FormData();
      formData.append("file", payload.file);
      formData.append("name", payload.name);
      if (payload.type) formData.append("type", payload.type);
      if (payload.category) formData.append("category", payload.category);
      if (payload.description) formData.append("description", payload.description);
      if (payload.content) formData.append("content", payload.content);
      if (payload.assignedTo) formData.append("assignedTo", payload.assignedTo);
      if (payload.team) formData.append("team", payload.team);
      if (payload.priority) formData.append("priority", payload.priority);
      if (payload.tags) formData.append("tags", Array.isArray(payload.tags) ? payload.tags.join(",") : payload.tags);
      if (payload.dueDate) formData.append("dueDate", payload.dueDate);
      if (payload.status) formData.append("status", payload.status);
      if (payload.submitApproval !== undefined) formData.append("submitApproval", String(payload.submitApproval));

      const { data } = await api.post<ApiResponse>(basePath, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    }

    const { data } = await api.post<ApiResponse>(basePath, payload);
    return data;
  },

  /** Update an existing document */
  updateDocument: async (id: string | number, payload: any, basePath = "/employee/documents"): Promise<ApiResponse> => {
    const method = basePath.includes("department-manager") ? "patch" : "put";
    const { data } = await api[method]<ApiResponse>(`${basePath}/${id}`, payload);
    return data;
  },

  /** Delete a document */
  deleteDocument: async (id: string | number, basePath = "/employee/documents"): Promise<ApiResponse> => {
    const { data } = await api.delete<ApiResponse>(`${basePath}/${id}`);
    return data;
  },

  /** Submit document for approval review */
  submitDocumentForApproval: async (id: string | number): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>(`/employee/documents/${id}/submit-approval`);
    return data;
  },

  /** Toggle document archive state */
  toggleArchiveDocument: async (id: string | number): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>(`/employee/documents/${id}/toggle-archive`);
    return data;
  },

  /** Share document with collaborators */
  shareDocument: async (id: string | number, payload: { email: string; permission?: string }): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>(`/employee/documents/${id}/share`, payload);
    return data;
  },

  // ─── 2. Department Manager Document Operations ──────────────────────────────
  /** Department manager document list */
  getDepartmentDocuments: async (params?: Record<string, any>): Promise<ApiResponse> => {
    return documentsApi.getDocuments(params, "/department-manager/documents");
  },

  /** Bulk action on documents (archive, delete, reassign, status change) */
  bulkDocumentAction: async (action: string, documentIds: (number | string)[], payload?: Record<string, any>): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>("/department-manager/documents/bulk", { action, documentIds, payload });
    return data;
  },

  /** Assign document to a team */
  assignDocumentToTeam: async (payload: { documentId: number | string; team: string; assignedTo?: string; priority?: string; notes?: string }): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>("/department-manager/team/assign-document", payload);
    return data;
  },

  // ─── 3. Team Leader Document Operations ────────────────────────────────────
  /** Team leader document list */
  getTeamDocuments: async (params?: { tab?: string; search?: string; category?: string }): Promise<ApiResponse> => {
    return documentsApi.getDocuments(params, "/team-leader/documents");
  },

  /** Add comment to a document */
  addDocumentComment: async (id: string | number, text: string): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>(`/team-leader/documents/${id}/comments`, { text });
    return data;
  },

  /** Update document review action (Approve, Reject, Request changes, Reassign) */
  updateDocumentAction: async (
    id: string | number,
    payload: { action: "APPROVE" | "REJECT" | "REQUEST_CHANGES" | "REASSIGN" | string; comment?: string; assignedTo?: string }
  ): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>(`/team-leader/documents/${id}/action`, payload);
    return data;
  },
};

export default documentsApi;
