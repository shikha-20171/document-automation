import api, { type ApiResponse } from "./api";

export interface CrmClient {
  id: string;
  organisationId?: number;
  name: string;
  type: "Company" | "Individual" | string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  industry?: string;
  companySize?: string;
  status: "Active" | "Inactive" | "Prospect" | "Archived" | string;
  department?: string;
  assignedTo?: string;
  tags?: string[];
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  contacts?: CrmContact[];
  documents?: CrmDocument[];
  requests?: CrmRequest[];
  activities?: CrmActivity[];
  notesList?: CrmNote[];
  contactsCount?: number;
  documentsCount?: number;
  requestsCount?: number;
}

export interface CrmContact {
  id: string;
  clientId: string;
  organisationId?: number;
  firstName: string;
  lastName?: string;
  designation?: string;
  email: string;
  phone?: string;
  department?: string;
  role?: string;
  isPrimary?: boolean;
  notes?: string;
  status?: "Active" | "Inactive" | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CrmDocument {
  id: string;
  clientId: string;
  organisationId?: number;
  title: string;
  type: string;
  status: string;
  owner?: string;
  fileKey?: string;
  version?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CrmRequest {
  id: string;
  clientId: string;
  organisationId?: number;
  clientName: string;
  title: string;
  type: string;
  description?: string;
  priority: "Low" | "Medium" | "High" | "Urgent" | string;
  status: string;
  assignedTo?: string;
  dueDate?: string;
  requestedBy?: string;
  attachments?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CrmNote {
  id: string;
  clientId: string;
  organisationId?: number;
  title: string;
  description: string;
  createdBy?: string;
  isPinned?: boolean;
  createdAt?: string;
}

export interface CrmActivity {
  id: string;
  clientId: string;
  organisationId?: number;
  type: string;
  description: string;
  user: string;
  createdAt: string;
  client?: { id: string; name: string };
}

export interface CrmDashboardStats {
  totalClients: number;
  activeClients: number;
  inactiveClients: number;
  prospectClients: number;
  archivedClients: number;
  totalContacts: number;
  totalDocuments: number;
  totalRequests: number;
  pendingRequests: number;
  completedRequests: number;
  recentActivities: CrmActivity[];
  recentClients: CrmClient[];
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  matchedClient?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    status?: string;
  };
  message?: string;
}

export const crmApi = {
  // ─── DASHBOARD STATS ───────────────────────────────────────────────────────
  getDashboardStats: async (): Promise<ApiResponse<CrmDashboardStats>> => {
    const { data } = await api.get<ApiResponse<CrmDashboardStats>>("/crm/dashboard-stats");
    return data;
  },

  // ─── DUPLICATE CHECK ───────────────────────────────────────────────────────
  checkDuplicate: async (payload: { name?: string; email?: string; phone?: string; excludeId?: string }): Promise<ApiResponse<DuplicateCheckResult>> => {
    const { data } = await api.post<ApiResponse<DuplicateCheckResult>>("/crm/clients/check-duplicate", payload);
    return data;
  },

  // ─── CLIENTS CRUD ──────────────────────────────────────────────────────────
  getClients: async (params?: Record<string, any>): Promise<ApiResponse<CrmClient[]>> => {
    const { data } = await api.get<ApiResponse<CrmClient[]>>("/crm/clients", { params });
    return data;
  },

  getClientById: async (id: string | number): Promise<ApiResponse<CrmClient>> => {
    const { data } = await api.get<ApiResponse<CrmClient>>(`/crm/clients/${id}`);
    return data;
  },

  createClient: async (payload: Partial<CrmClient>): Promise<ApiResponse<CrmClient>> => {
    const { data } = await api.post<ApiResponse<CrmClient>>("/crm/clients", payload);
    return data;
  },

  updateClient: async (id: string | number, payload: Partial<CrmClient>): Promise<ApiResponse<CrmClient>> => {
    const { data } = await api.put<ApiResponse<CrmClient>>(`/crm/clients/${id}`, payload);
    return data;
  },

  archiveClient: async (id: string | number): Promise<ApiResponse<CrmClient>> => {
    const { data } = await api.patch<ApiResponse<CrmClient>>(`/crm/clients/${id}/archive`);
    return data;
  },

  restoreClient: async (id: string | number): Promise<ApiResponse<CrmClient>> => {
    const { data } = await api.patch<ApiResponse<CrmClient>>(`/crm/clients/${id}/restore`);
    return data;
  },

  deleteClient: async (id: string | number): Promise<ApiResponse> => {
    const { data } = await api.delete<ApiResponse>(`/crm/clients/${id}`);
    return data;
  },

  // ─── CONTACTS CRUD ─────────────────────────────────────────────────────────
  getContacts: async (clientId?: string | number): Promise<ApiResponse<CrmContact[]>> => {
    const url = clientId ? `/crm/clients/${clientId}/contacts` : "/crm/contacts";
    const { data } = await api.get<ApiResponse<CrmContact[]>>(url);
    return data;
  },

  addContact: async (clientId: string | number, payload: Partial<CrmContact>): Promise<ApiResponse<CrmContact>> => {
    const { data } = await api.post<ApiResponse<CrmContact>>(`/crm/clients/${clientId}/contacts`, payload);
    return data;
  },

  updateContact: async (contactId: string | number, payload: Partial<CrmContact>): Promise<ApiResponse<CrmContact>> => {
    const { data } = await api.put<ApiResponse<CrmContact>>(`/crm/contacts/${contactId}`, payload);
    return data;
  },

  deleteContact: async (contactId: string | number): Promise<ApiResponse> => {
    const { data } = await api.delete<ApiResponse>(`/crm/contacts/${contactId}`);
    return data;
  },

  // ─── DOCUMENTS CRUD ────────────────────────────────────────────────────────
  getClientDocuments: async (clientId?: string | number): Promise<ApiResponse<CrmDocument[]>> => {
    const url = clientId ? `/crm/clients/${clientId}/documents` : "/crm/documents";
    const { data } = await api.get<ApiResponse<CrmDocument[]>>(url);
    return data;
  },

  addClientDocument: async (clientId: string | number, payload: Partial<CrmDocument>): Promise<ApiResponse<CrmDocument>> => {
    const { data } = await api.post<ApiResponse<CrmDocument>>(`/crm/clients/${clientId}/documents`, payload);
    return data;
  },

  updateClientDocument: async (documentId: string | number, payload: Partial<CrmDocument>): Promise<ApiResponse<CrmDocument>> => {
    const { data } = await api.put<ApiResponse<CrmDocument>>(`/crm/documents/${documentId}`, payload);
    return data;
  },

  deleteClientDocument: async (documentId: string | number): Promise<ApiResponse> => {
    const { data } = await api.delete<ApiResponse>(`/crm/documents/${documentId}`);
    return data;
  },

  // ─── REQUESTS CRUD ─────────────────────────────────────────────────────────
  getRequests: async (clientId?: string | number): Promise<ApiResponse<CrmRequest[]>> => {
    const url = clientId ? `/crm/clients/${clientId}/requests` : "/crm/requests";
    const { data } = await api.get<ApiResponse<CrmRequest[]>>(url);
    return data;
  },

  createRequest: async (clientId: string | number, payload: Partial<CrmRequest>): Promise<ApiResponse<CrmRequest>> => {
    const { data } = await api.post<ApiResponse<CrmRequest>>(`/crm/clients/${clientId}/requests`, payload);
    return data;
  },

  updateRequest: async (requestId: string | number, payload: Partial<CrmRequest>): Promise<ApiResponse<CrmRequest>> => {
    const { data } = await api.put<ApiResponse<CrmRequest>>(`/crm/requests/${requestId}`, payload);
    return data;
  },

  deleteRequest: async (requestId: string | number): Promise<ApiResponse> => {
    const { data } = await api.delete<ApiResponse>(`/crm/requests/${requestId}`);
    return data;
  },

  // ─── NOTES CRUD ────────────────────────────────────────────────────────────
  getNotes: async (clientId?: string | number): Promise<ApiResponse<CrmNote[]>> => {
    const url = clientId ? `/crm/clients/${clientId}/notes` : "/crm/notes";
    const { data } = await api.get<ApiResponse<CrmNote[]>>(url);
    return data;
  },

  createNote: async (clientId: string | number, payload: Partial<CrmNote>): Promise<ApiResponse<CrmNote>> => {
    const { data } = await api.post<ApiResponse<CrmNote>>(`/crm/clients/${clientId}/notes`, payload);
    return data;
  },

  updateNote: async (noteId: string | number, payload: Partial<CrmNote>): Promise<ApiResponse<CrmNote>> => {
    const { data } = await api.put<ApiResponse<CrmNote>>(`/crm/notes/${noteId}`, payload);
    return data;
  },

  deleteNote: async (noteId: string | number): Promise<ApiResponse> => {
    const { data } = await api.delete<ApiResponse>(`/crm/notes/${noteId}`);
    return data;
  },

  // ─── ACTIVITIES ────────────────────────────────────────────────────────────
  getActivities: async (clientId?: string | number): Promise<ApiResponse<CrmActivity[]>> => {
    const url = clientId ? `/crm/clients/${clientId}/activities` : "/crm/activities";
    const { data } = await api.get<ApiResponse<CrmActivity[]>>(url);
    return data;
  },

  addActivity: async (clientId: string | number, payload: Partial<CrmActivity>): Promise<ApiResponse<CrmActivity>> => {
    const { data } = await api.post<ApiResponse<CrmActivity>>(`/crm/clients/${clientId}/activities`, payload);
    return data;
  },

  // ─── BATCH IMPORT ──────────────────────────────────────────────────────────
  importClients: async (records: Array<Record<string, any>>): Promise<ApiResponse<any>> => {
    const { data } = await api.post<ApiResponse<any>>("/crm/clients/import", { records });
    return data;
  },

  // ─── ONBOARDING FLOW ───────────────────────────────────────────────────────
  onboardWithContract: async (payload: any): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>("/crm/clients/onboard", payload);
    return data;
  },
};

export default crmApi;
