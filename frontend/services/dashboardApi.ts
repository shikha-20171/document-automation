import api, { type ApiResponse } from "./api";
import type { EmployeeDashboardData } from "./types/dashboard";

export const dashboardApi = {
  /** Get Employee KPI dashboard & telemetry */
  getEmployeeDashboard: async (): Promise<ApiResponse<EmployeeDashboardData>> => {
    const { data } = await api.get<ApiResponse<EmployeeDashboardData>>("/employee/dashboard");
    return data;
  },

  /** Get Team Leader dashboard overview */
  getTeamLeaderDashboard: async (): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>("/team-leader/dashboard");
    return data;
  },

  /** Get Department Manager dashboard */
  getDepartmentManagerDashboard: async (range = "7d"): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>("/department-manager/dashboard", {
      params: { range },
    });
    return data;
  },

  /** Get Super Admin platform stats */
  getSuperAdminStats: async (): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>("/super-admin/dashboard/stats");
    return data;
  },

  /** Get Super Admin month-by-month growth data */
  getSuperAdminGrowth: async (): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>("/super-admin/dashboard/growth");
    return data;
  },

  /** General dashboard fetcher supporting endpoint path or role */
  getDashboard: async (roleOrEndpoint: "employee" | "team-leader" | "department-manager" | string = "employee", params?: any): Promise<ApiResponse> => {
    if (roleOrEndpoint === "department-manager") {
      return dashboardApi.getDepartmentManagerDashboard(params?.range);
    }
    if (roleOrEndpoint === "team-leader") {
      return dashboardApi.getTeamLeaderDashboard();
    }
    if (roleOrEndpoint.startsWith("/")) {
      const { data } = await api.get<ApiResponse>(roleOrEndpoint, { params });
      return data;
    }
    return dashboardApi.getEmployeeDashboard();
  },
};

export default dashboardApi;
