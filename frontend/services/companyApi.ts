import api, { type ApiResponse } from "./api";

export interface Company {
  id: string;
  company_name: string;
  company_code: string;
  email: string;
  phone_no: string;
  website?: string;
  city?: string;
  street?: string;
  state?: string;
  country?: string;
  timezone?: string;
  currency?: string;
  logo?: string;
  subscription_plan?: string;
  status?: string;
  is_active?: boolean;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateCompanyData {
  companyName: string;
  email: string;
  phoneNo: string;
  website?: string;
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  timezone?: string;
  currency?: string;
  logo?: string;
  subscriptionPlan?: string;
  adminName?: string;
  adminEmail?: string;
  password?: string;
}

export const companyApi = {
  /** Create a new company */
  create: async (payload: CreateCompanyData): Promise<Company> => {
    const { data } = await api.post<ApiResponse<Company>>("/companies", payload);
    if (!data.success) {
      throw new Error(data.message || "Failed to create company.");
    }
    return data.data;
  },

  /** Get current company profile */
  get: async (): Promise<Company> => {
    const { data } = await api.get<ApiResponse<Company>>("/companies");
    if (!data.success) {
      throw new Error("Failed to fetch company.");
    }
    return data.data;
  },

  /** Update company by ID */
  update: async (id: string, payload: Partial<CreateCompanyData>): Promise<Company> => {
    const { data } = await api.put<ApiResponse<Company>>(`/companies/${id}`, payload);
    if (!data.success) {
      throw new Error(data.message || "Failed to update company.");
    }
    return data.data;
  },
};

export default companyApi;
