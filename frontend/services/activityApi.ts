import api, { type ApiResponse } from "./api";

export const activityApi = {
  /** Get user activity log (Org Admin) */
  getUserActivityLog: async (): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>("/org-admin/team/activity");
    return data;
  },
};

export default activityApi;
