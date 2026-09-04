import api, { type ApiResponse } from "./api";

export const profileApi = {
  /** Get user profile info */
  getProfile: async (basePath = "/employee/profile"): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>(basePath);
    return data;
  },

  /** Update profile contact info & preferences */
  updateProfile: async (payload: any, basePath = "/employee/profile"): Promise<ApiResponse> => {
    const method = basePath.includes("department-manager") || basePath.includes("team-leader") ? "patch" : "put";
    const { data } = await api[method]<ApiResponse>(basePath, payload);
    return data;
  },

  /** Change password */
  changePassword: async (
    payload: {
      currentPassword?: string;
      newPassword?: string;
      confirmPassword?: string;
      oldPassword?: string;
    },
    basePath = "/employee/profile/change-password"
  ): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>(basePath, payload);
    return data;
  },

  /** Terminate active session (Employee) */
  terminateSession: async (sessionId: string | number): Promise<ApiResponse> => {
    const { data } = await api.delete<ApiResponse>(`/employee/profile/sessions/${sessionId}`);
    return data;
  },
};

export default profileApi;
