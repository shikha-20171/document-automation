import api, { type ApiResponse } from "./api";
import type {
  CreateOrganisationAdminData,
  CreateOrganisationData,
  Organisation,
  OrganisationAdmin,
  OrganisationBranch,
  OrganisationFilters,
} from "./types/organization";

export const organizationsApi = {
  /** Get all organizations with filters */
  getAll: async (filters?: OrganisationFilters): Promise<ApiResponse<Organisation[]>> => {
    const { data } = await api.get<ApiResponse<Organisation[]>>("/organisations", { params: filters });
    return data;
  },

  /** Get single organization by ID */
  getById: async (id: string | number): Promise<ApiResponse<Organisation>> => {
    const { data } = await api.get<ApiResponse<Organisation>>(`/organisations/${id}`);
    return data;
  },

  /** Create a new organization */
  create: async (payload: CreateOrganisationData): Promise<ApiResponse<Organisation>> => {
    const { data } = await api.post<ApiResponse<Organisation>>("/organisations", payload);
    return data;
  },

  /** Update organization */
  update: async (id: string | number, payload: Partial<CreateOrganisationData>): Promise<ApiResponse<Organisation>> => {
    const { data } = await api.put<ApiResponse<Organisation>>(`/organisations/${id}`, payload);
    return data;
  },

  /** Delete organization */
  delete: async (id: string | number): Promise<ApiResponse> => {
    const { data } = await api.delete<ApiResponse>(`/organisations/${id}`);
    return data;
  },

  /** Suspend organization */
  suspend: async (id: string | number, reason?: string): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>(`/organisations/${id}/suspend`, { reason });
    return data;
  },

  /** Activate organization */
  activate: async (id: string | number): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>(`/organisations/${id}/activate`);
    return data;
  },

  /** Resend invitation to organization admin */
  resendInvitation: async (id: string | number): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>(`/organisations/${id}/resend-invitation`);
    return data;
  },

  /** Get organization branches */
  getBranches: async (orgId: string | number): Promise<ApiResponse<OrganisationBranch[]>> => {
    const { data } = await api.get<ApiResponse<OrganisationBranch[]>>(`/organisations/${orgId}/branches`);
    return data;
  },

  /** Create branch */
  createBranch: async (orgId: string | number, payload: Partial<OrganisationBranch>): Promise<ApiResponse<OrganisationBranch>> => {
    const { data } = await api.post<ApiResponse<OrganisationBranch>>(`/organisations/${orgId}/branches`, payload);
    return data;
  },

  /** Get organization admins */
  getAdmins: async (orgId: string | number): Promise<ApiResponse<OrganisationAdmin[]>> => {
    const { data } = await api.get<ApiResponse<OrganisationAdmin[]>>(`/organisations/${orgId}/admins`);
    return data;
  },

  /** Create organization admin */
  createAdmin: async (payload: CreateOrganisationAdminData): Promise<ApiResponse<OrganisationAdmin>> => {
    const { data } = await api.post<ApiResponse<OrganisationAdmin>>("/organisation-admins", payload);
    return data;
  },

  /** Update organization admin */
  updateAdmin: async (id: string | number, payload: Partial<CreateOrganisationAdminData>): Promise<ApiResponse<OrganisationAdmin>> => {
    const { data } = await api.put<ApiResponse<OrganisationAdmin>>(`/organisation-admins/${id}`, payload);
    return data;
  },

  /** Delete organization admin */
  deleteAdmin: async (id: string | number): Promise<ApiResponse> => {
    const { data } = await api.delete<ApiResponse>(`/organisation-admins/${id}`);
    return data;
  },

  /** Get organization platform stats summary */
  getStats: async (): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>("/organisations/stats/summary");
    return data;
  },

  // ─── Subscriptions ─────────────────────────────────────────────────────────
  getPlans: async (): Promise<ApiResponse<any[]>> => {
    const { data } = await api.get<ApiResponse<any[]>>("/super-admin/subscriptions/plans");
    return data;
  },

  createPlan: async (payload: any): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>("/super-admin/subscriptions/plans", payload);
    return data;
  },

  updatePlan: async (id: string | number, payload: any): Promise<ApiResponse> => {
    const { data } = await api.put<ApiResponse>(`/super-admin/subscriptions/plans/${id}`, payload);
    return data;
  },

  deletePlan: async (id: string | number): Promise<ApiResponse> => {
    const { data } = await api.delete<ApiResponse>(`/super-admin/subscriptions/plans/${id}`);
    return data;
  },

  getOrgSubscriptions: async (): Promise<ApiResponse<any[]>> => {
    const { data } = await api.get<ApiResponse<any[]>>("/super-admin/subscriptions/org-subscriptions");
    return data;
  },

  updateOrgSubscription: async (id: string | number, payload: any): Promise<ApiResponse> => {
    const { data } = await api.put<ApiResponse>(`/super-admin/subscriptions/org-subscriptions/${id}`, payload);
    return data;
  },

  getSubscriptionRequests: async (): Promise<ApiResponse<any[]>> => {
    const { data } = await api.get<ApiResponse<any[]>>("/super-admin/subscriptions/requests");
    return data;
  },

  handleSubscriptionRequest: async (id: string | number, payload: any): Promise<ApiResponse> => {
    const { data } = await api.put<ApiResponse>(`/super-admin/subscriptions/requests/${id}`, payload);
    return data;
  },
};

// Aliases
export const organisationApi = organizationsApi;
export default organizationsApi;
