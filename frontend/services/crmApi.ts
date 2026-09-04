import api, { type ApiResponse } from "./api";

export interface CrmClient {
  id: string;
  name: string;
  industry?: string;
  status: "ACTIVE" | "INACTIVE" | "LEAD" | "PENDING" | string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  contactsCount?: number;
  documentsCount?: number;
  requestsCount?: number;
  createdAt?: string;
}

export const crmApi = {
  /** Get all CRM clients */
  getClients: async (params?: Record<string, any>): Promise<ApiResponse<CrmClient[]>> => {
    const { data } = await api.get<ApiResponse<CrmClient[]>>("/crm/clients", { params });
    return data;
  },

  /** Get single CRM client */
  getClientById: async (id: string | number): Promise<ApiResponse<CrmClient>> => {
    const { data } = await api.get<ApiResponse<CrmClient>>(`/crm/clients/${id}`);
    return data;
  },

  /** Create a new CRM client */
  createClient: async (payload: Partial<CrmClient>): Promise<ApiResponse<CrmClient>> => {
    const { data } = await api.post<ApiResponse<CrmClient>>("/crm/clients", payload);
    return data;
  },

  /** Update an existing CRM client */
  updateClient: async (id: string | number, payload: Partial<CrmClient>): Promise<ApiResponse<CrmClient>> => {
    const { data } = await api.put<ApiResponse<CrmClient>>(`/crm/clients/${id}`, payload);
    return data;
  },

  /** Delete a CRM client */
  deleteClient: async (id: string | number): Promise<ApiResponse> => {
    const { data } = await api.delete<ApiResponse>(`/crm/clients/${id}`);
    return data;
  },

  /** Add contact to a client */
  addContact: async (clientId: string | number, payload: any): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>(`/crm/clients/${clientId}/contacts`, payload);
    return data;
  },

  /** Onboard client with contract */
  onboardWithContract: async (payload: any): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>("/crm/clients/onboard", payload);
    return data;
  },
};

export default crmApi;
