import api, { type ApiResponse } from "./api";

export interface LoginPayload {
  email?: string;
  password?: string;
  [key: string]: any;
}

export interface ResetPasswordPayload {
  token?: string;
  password?: string;
  [key: string]: any;
}

export const authApi = {
  /** Login with email and password */
  login: async (payload: LoginPayload): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>("/auth/login", payload);
    return data;
  },

  /** Send password reset email */
  forgotPassword: async (email: string): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>("/auth/forgot-password", { email });
    return data;
  },

  /** Reset password with token */
  resetPassword: async (payload: ResetPasswordPayload): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>("/auth/reset-password", payload);
    return data;
  },

  /** Verify invitation token */
  verifyInvitation: async (token: string): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>("/auth/invitation/verify", { token });
    return data;
  },

  /** Activate account from invitation */
  activateInvitation: async (token: string, password?: string): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>("/auth/invitation/activate", { token, password });
    return data;
  },

  /** Get authenticated user info */
  getMe: async (): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>("/auth/me");
    return data;
  },
};

export default authApi;
