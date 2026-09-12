import api, { type ApiResponse } from "./api";

export interface CreateWorkflowPayload {
  name: string;
  description?: string;
  appliesTo?: string;
  department?: string;
  trigger?: string;
  logicType?: string;
  logicRequirement?: string;
  status?: "ACTIVE" | "DRAFT" | "PAUSED" | string;
  approvalDeadlineDays?: number;
  steps?: Array<{
    stepOrder?: number;
    name: string;
    approverType?: string;
    approvalType?: string;
    externalApproverName?: string;
    externalApproverEmail?: string;
    externalApproverCompany?: string;
  }>;
}

export const workflowApi = {
  // ─── Org Admin Workflows ───────────────────────────────────────────────────
  /** Get all workflows for organisation */
  getOrgWorkflows: async (params?: { status?: string; search?: string; page?: number; limit?: number }): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>("/org-admin/workflows", { params });
    return data;
  },

  /** Create a new workflow */
  createOrgWorkflow: async (payload: CreateWorkflowPayload): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>("/org-admin/workflows", payload);
    return data;
  },

  /** Update workflow */
  updateOrgWorkflow: async (id: string | number, payload: Partial<CreateWorkflowPayload>): Promise<ApiResponse> => {
    const { data } = await api.put<ApiResponse>(`/org-admin/workflows/${id}`, payload);
    return data;
  },

  /** Toggle workflow status (ACTIVE, DRAFT, PAUSED) */
  toggleOrgWorkflowStatus: async (id: string | number, status: string): Promise<ApiResponse> => {
    const { data } = await api.patch<ApiResponse>(`/org-admin/workflows/${id}/status`, { status });
    return data;
  },

  /** Delete workflow */
  deleteOrgWorkflow: async (id: string | number): Promise<ApiResponse> => {
    const { data } = await api.delete<ApiResponse>(`/org-admin/workflows/${id}`);
    return data;
  },

  /** Duplicate workflow */
  duplicateOrgWorkflow: async (id: string | number): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>(`/org-admin/workflows/${id}/duplicate`);
    return data;
  },

  /** Get live approval requests queue for Org Admin */
  getOrgApprovalRequests: async (): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>("/org-admin/workflows/requests");
    return data;
  },

  /** Process approval action (Approve, Reject, Request Changes) for Org Admin */
  processOrgApprovalAction: async (
    requestId: string | number,
    payload: { action: "APPROVE" | "REJECT" | "REQUEST_CHANGES" | string; comment?: string }
  ): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>(`/org-admin/workflows/requests/${requestId}/action`, payload);
    return data;
  },

  /** Get workflow history logs for Org Admin */
  getOrgWorkflowHistory: async (): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>("/org-admin/workflows/history");
    return data;
  },

  // ─── Document-Centric Workflow Engine (Org Admin) ─────────────────────────
  /** Get overview summary stats */
  getOverviewStats: async (): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>("/org-admin/workflow/overview");
    return data;
  },

  /** Get pending / active workflow documents */
  getPendingDocuments: async (params?: { search?: string; status?: string; documentType?: string; stage?: string }): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>("/org-admin/workflow/documents", { params });
    return data;
  },

  /** Get complete document review payload */
  getDocumentReview: async (id: string): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>(`/org-admin/workflow/documents/${id}/review`);
    return data;
  },

  /** Approve document (Org Admin) */
  approveDocument: async (id: string, comment?: string): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>(`/org-admin/workflow/documents/${id}/approve`, { comment });
    return data;
  },

  /** Reject document (Org Admin) */
  rejectDocument: async (id: string, reason: string): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>(`/org-admin/workflow/documents/${id}/reject`, { reason, comment: reason });
    return data;
  },

  /** Request changes on document (Org Admin) */
  requestDocumentChanges: async (id: string, comment: string): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>(`/org-admin/workflow/documents/${id}/request-changes`, { comment, reason: comment });
    return data;
  },

  /** Get workflow rules per document type */
  getWorkflowConfig: async (): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>("/org-admin/workflow/config");
    return data;
  },

  /** Update workflow rules per document type */
  updateWorkflowConfig: async (configs: any[]): Promise<ApiResponse> => {
    const { data } = await api.put<ApiResponse>("/org-admin/workflow/config", { configs });
    return data;
  },

  /** Get chronological workflow audit log */
  getWorkflowAuditHistory: async (): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>("/org-admin/workflow/audit-history");
    return data;
  },

  // ─── Team Leader Workflows ─────────────────────────────────────────────────
  /** Get workflows list (Team Leader) */
  getWorkflows: async (params?: { tab?: string; search?: string }): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>("/team-leader/workflows", { params });
    return data;
  },

  /** Execute a step in the workflow process */
  executeWorkflowStep: async (
    id: string | number,
    payload: { action: "APPROVE" | "REJECT" | "REQUEST_CHANGES" | "COMPLETE" | string; notes?: string; comment?: string }
  ): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>(`/team-leader/workflows/${id}/execute-step`, payload);
    return data;
  },

  /** Add comment to a workflow item */
  addWorkflowComment: async (id: string | number, text: string): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>(`/team-leader/workflows/${id}/comments`, { text });
    return data;
  },
};

export default workflowApi;
