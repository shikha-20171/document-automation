import api, { type ApiResponse } from "./api";
import type { ProcessApprovalPayload } from "./types/approval";

export const approvalsApi = {
  // ─── 1. Employee Approval Tracking ───────────────────────────────────────────
  /** Get employee submitted approvals */
  getApprovals: async (params?: { status?: string; tab?: string }, basePath = "/employee/approvals"): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>(basePath, { params });
    return data;
  },

  /** Resubmit rejected/revised document for approval */
  resubmitApproval: async (id: string | number, payload: { content?: string; notes?: string }): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>(`/employee/approvals/${id}/resubmit`, payload);
    return data;
  },

  /** Cancel an employee approval request */
  cancelApproval: async (id: string | number): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>(`/employee/approvals/${id}/cancel`);
    return data;
  },

  // ─── 2. Reviewer Actions (Team Leader & Department Manager) ───────────────────
  /** Team Leader approval list */
  getTeamLeaderApprovals: async (params?: { tab?: string }): Promise<ApiResponse> => {
    return approvalsApi.getApprovals(params, "/team-leader/approvals");
  },

  /** Process approval decision (Team Leader) */
  processApproval: async (id: string | number, payload: ProcessApprovalPayload): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>(`/team-leader/approvals/${id}/action`, payload);
    return data;
  },

  /** Department Manager approval list */
  getDepartmentApprovals: async (params?: Record<string, any>): Promise<ApiResponse> => {
    return approvalsApi.getApprovals(params, "/department-manager/approvals");
  },

  /** Handle approval action (Department Manager) */
  handleApprovalAction: async (
    id: string | number,
    action: "APPROVE" | "REJECT" | "REQUEST_CHANGES" | "FORWARD" | string,
    comment?: string,
    payload?: { forwardToOrgAdmin?: boolean; forwardToTarget?: string }
  ): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>(`/department-manager/approvals/${id}/action`, {
      action,
      comment,
      ...payload,
    });
    return data;
  },
};

export default approvalsApi;
