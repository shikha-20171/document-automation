import api, { type ApiResponse } from "./api";

export const departmentsApi = {
  /** Get organization departments list */
  getDepartments: async (): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>("/org-admin/team/departments");
    return data;
  },

  /** Create department */
  createDepartment: async (deptData: {
    name: string;
    description?: string;
    manager?: string;
    managerName?: string;
    managerEmail?: string;
    email?: string;
  }): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>("/org-admin/team/departments", deptData);
    return data;
  },

  /** Delete department */
  deleteDepartment: async (id: number | string): Promise<ApiResponse> => {
    const { data } = await api.delete<ApiResponse>(`/org-admin/team/departments/${id}`);
    return data;
  },
};

export default departmentsApi;
