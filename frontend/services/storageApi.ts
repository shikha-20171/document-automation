import api, { type ApiResponse } from "./api";

export const storageApi = {
  /** Get storage overview metrics */
  getOverview: async (): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>("/super-admin/storage/overview");
    return data;
  },

  /** Get storage configs */
  getConfigs: async (): Promise<ApiResponse<any[]>> => {
    const { data } = await api.get<ApiResponse<any[]>>("/super-admin/storage/configs");
    return data;
  },

  /** Update storage config */
  updateConfig: async (id: string | number, payload: any): Promise<ApiResponse> => {
    const { data } = await api.put<ApiResponse>(`/super-admin/storage/configs/${id}`, payload);
    return data;
  },

  /** Get backups list */
  getBackups: async (): Promise<ApiResponse<any[]>> => {
    const { data } = await api.get<ApiResponse<any[]>>("/super-admin/storage/backups");
    return data;
  },

  /** Run manual backup */
  runBackup: async (payload: any): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>("/super-admin/storage/backups/run", payload);
    return data;
  },

  /** Get retention policies */
  getRetention: async (): Promise<ApiResponse<any[]>> => {
    const { data } = await api.get<ApiResponse<any[]>>("/super-admin/storage/retention");
    return data;
  },

  /** Create retention policy */
  createRetention: async (payload: any): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>("/super-admin/storage/retention", payload);
    return data;
  },

  /** Get storage alerts */
  getAlerts: async (): Promise<ApiResponse<any[]>> => {
    const { data } = await api.get<ApiResponse<any[]>>("/super-admin/storage/alerts");
    return data;
  },
};

export default storageApi;
