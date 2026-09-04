import api, { type ApiResponse } from "./api";

export interface SuperAdminUserItem {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  organisationName: string;
  departmentName?: string;
  teamName?: string;
  createdAt: string;
}

export interface SuperAdminUserListResponse {
  data: SuperAdminUserItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  stats: {
    totalUsers: number;
    superAdmins: number;
    orgAdmins: number;
    deptManagers: number;
    teamLeads: number;
    employees: number;
  };
}

export const superAdminUsersApi = {
  getUsers: async (params?: any): Promise<ApiResponse<SuperAdminUserItem[]> & { pagination: any; stats: any }> => {
    const { data } = await api.get<any>("/super-admin/users-access", { params });
    return data;
  },

  toggleUserStatus: async (id: number, status?: string): Promise<ApiResponse<any>> => {
    const { data } = await api.put<ApiResponse<any>>(`/super-admin/users-access/${id}/status`, { status });
    return data;
  },

  changeUserRole: async (id: number, role: string): Promise<ApiResponse<any>> => {
    const { data } = await api.put<ApiResponse<any>>(`/super-admin/users-access/${id}/role`, { role });
    return data;
  },
};

export default superAdminUsersApi;
