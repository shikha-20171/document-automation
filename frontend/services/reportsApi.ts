import api, { type ApiResponse } from "./api";

export const reportsApi = {
  /** Get personal productivity & operational reports (Employee) */
  getPersonalReports: async (): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>("/employee/reports");
    return data;
  },

  /** Get Team Leader reports */
  getTeamReports: async (): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>("/team-leader/reports");
    return data;
  },

  /** Get Department Manager reports */
  getDepartmentReports: async (params?: Record<string, any>): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>("/department-manager/reports", { params });
    return data;
  },

  /** General reports fetcher */
  getReports: async (basePath = "/department-manager/reports", params?: any): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>(basePath, { params });
    return data;
  },
};

export default reportsApi;
