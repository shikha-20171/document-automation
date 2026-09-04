import api, { type ApiResponse } from "./api";

export const supportApi = {
  // ─── Org Admin Support ────────────────────────────────────────────────────────
  getDashboardMetrics: async (): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>("/org-admin/support/dashboard");
    return data;
  },

  getTickets: async (params?: { status?: string; priority?: string }, basePath = "/org-admin/support/tickets"): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>(basePath, { params });
    return data;
  },

  createTicket: async (ticketData: any, basePath = "/org-admin/support/tickets"): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>(basePath, ticketData);
    return data;
  },

  getTicketDetails: async (id: string | number): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>(`/org-admin/support/tickets/${id}`);
    return data;
  },

  addReply: async (ticketId: string | number, message: string): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>(`/org-admin/support/tickets/${ticketId}/replies`, { message });
    return data;
  },

  getHelpCenterGuides: async (): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>("/org-admin/support/help-center");
    return data;
  },

  // ─── Team Leader Support ────────────────────────────────────────────────────
  getSupportData: async (): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>("/team-leader/support");
    return data;
  },

  createTeamLeaderTicket: async (payload: { subject: string; category?: string; priority?: string; description: string }): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>("/team-leader/support/tickets", payload);
    return data;
  },

  // ─── Super Admin Support ────────────────────────────────────────────────────
  updateTicket: async (id: string | number, payload: any): Promise<ApiResponse> => {
    const { data } = await api.put<ApiResponse>(`/super-admin/support/tickets/${id}`, payload);
    return data;
  },

  replyTicket: async (id: string | number, payload: any): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>(`/super-admin/support/tickets/${id}/reply`, payload);
    return data;
  },
};

export const orgSupportApi = supportApi;
export default supportApi;
