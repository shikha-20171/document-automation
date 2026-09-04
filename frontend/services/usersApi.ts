import api, { type ApiResponse } from "./api";
import type { CreateUserPayload, InviteUserPayload } from "./types/user";

export const usersApi = {
  /** Get organization users list */
  getUsers: async (): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>("/org-admin/team/users");
    return data;
  },

  /** Create a new user */
  createUser: async (userData: CreateUserPayload): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>("/org-admin/team/users", userData);
    return data;
  },

  /** Update an existing user */
  updateUser: async (id: number | string, data: any): Promise<ApiResponse> => {
    const { data: res } = await api.put<ApiResponse>(`/org-admin/team/users/${id}`, data);
    return res;
  },

  /** Toggle user active status */
  toggleUserStatus: async (id: number | string, status: string): Promise<ApiResponse> => {
    const { data } = await api.patch<ApiResponse>(`/org-admin/team/users/${id}/status`, { status });
    return data;
  },

  /** Delete a user */
  deleteUser: async (id: number | string): Promise<ApiResponse> => {
    const { data } = await api.delete<ApiResponse>(`/org-admin/team/users/${id}`);
    return data;
  },

  /** Send user invitation */
  inviteUser: async (inviteData: InviteUserPayload): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>("/org-admin/team/users/invite", inviteData);
    return data;
  },

  /** Resend invitation email */
  resendInvite: async (email: string): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>("/org-admin/team/users/resend-invite", { email });
    return data;
  },

  /** Get role-permissions matrix */
  getPermissionsMatrix: async (): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>("/org-admin/team/permissions");
    return data;
  },
};

export default usersApi;
