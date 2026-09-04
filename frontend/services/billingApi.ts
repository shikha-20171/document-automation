import api, { type ApiResponse } from "./api";

export const billingApi = {
  getOverview: async (): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>("/super-admin/billing/overview");
    return data;
  },

  getInvoices: async (): Promise<ApiResponse<any[]>> => {
    const { data } = await api.get<ApiResponse<any[]>>("/super-admin/billing/invoices");
    return data;
  },

  createInvoice: async (payload: any): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>("/super-admin/billing/invoices", payload);
    return data;
  },

  getTransactions: async (): Promise<ApiResponse<any[]>> => {
    const { data } = await api.get<ApiResponse<any[]>>("/super-admin/billing/transactions");
    return data;
  },

  getRefunds: async (): Promise<ApiResponse<any[]>> => {
    const { data } = await api.get<ApiResponse<any[]>>("/super-admin/billing/refunds");
    return data;
  },

  updateRefund: async (id: string | number, payload: any): Promise<ApiResponse> => {
    const { data } = await api.put<ApiResponse>(`/super-admin/billing/refunds/${id}`, payload);
    return data;
  },

  getGateways: async (): Promise<ApiResponse<any[]>> => {
    const { data } = await api.get<ApiResponse<any[]>>("/super-admin/billing/gateways");
    return data;
  },

  updateGateway: async (id: string | number, payload: any): Promise<ApiResponse> => {
    const { data } = await api.put<ApiResponse>(`/super-admin/billing/gateways/${id}`, payload);
    return data;
  },

  getSettings: async (): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>("/super-admin/billing/settings");
    return data;
  },

  updateSettings: async (payload: any): Promise<ApiResponse> => {
    const { data } = await api.put<ApiResponse>("/super-admin/billing/settings", payload);
    return data;
  },
};

export default billingApi;
