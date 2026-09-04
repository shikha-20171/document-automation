import api, { type ApiResponse } from "./api";

export interface SystemHealthData {
  status: string;
  uptimeSeconds: number;
  database: {
    status: string;
    latencyMs: number;
    connectionPool: string;
  };
  memory: {
    rssMb: number;
    heapUsedMb: number;
    heapTotalMb: number;
  };
  queue: {
    activeJobs: number;
    pendingJobs: number;
    completedToday: number;
    failedToday: number;
  };
  telemetry: {
    totalAuditRecords: number;
    errorLogs24h: number;
    apiAvgLatencyMs: number;
  };
}

export const superAdminMonitoringApi = {
  getHealth: async (): Promise<ApiResponse<SystemHealthData>> => {
    const { data } = await api.get<ApiResponse<SystemHealthData>>("/super-admin/monitoring/health");
    return data;
  },

  getSystemLogs: async (): Promise<ApiResponse<any[]>> => {
    const { data } = await api.get<ApiResponse<any[]>>("/super-admin/monitoring/logs");
    return data;
  },
};

export default superAdminMonitoringApi;
