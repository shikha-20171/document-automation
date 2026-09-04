import api, { type ApiResponse } from "./api";
import type { AssignWorkPayload, CreateTeamPayload } from "./types/team";

export const teamsApi = {
  // ─── 1. Org Admin Teams ───────────────────────────────────────────────────────
  /** Get all organization teams */
  getTeams: async (): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>("/org-admin/team/teams");
    return data;
  },

  /** Create team (Org Admin) */
  createTeam: async (teamData: { name: string; department: string; teamLead: string }): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>("/org-admin/team/teams", teamData);
    return data;
  },

  // ─── 2. Department Manager Team Operations ──────────────────────────────────
  /** Get department team structure and members */
  getDepartmentTeam: async (): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>("/department-manager/team");
    return data;
  },

  /** Create team under department */
  createDepartmentTeam: async (payload: CreateTeamPayload): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>("/department-manager/team/create-team", payload);
    return data;
  },

  /** Add member to department team */
  addTeamMember: async (payload: { name: string; email: string; role?: string; team?: string; phone?: string }): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>("/department-manager/team", payload);
    return data;
  },

  /** Invite Team Leader */
  inviteTeamLeader: async (payload: { name: string; email: string; team?: string; phone?: string; department?: string }): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>("/department-manager/team/invite-leader", payload);
    return data;
  },

  /** Resend Team Leader invitation */
  resendTeamLeaderInvite: async (email: string): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>("/department-manager/team/resend-invite", { email });
    return data;
  },

  /** Update department team */
  updateTeam: async (id: string | number, payload: CreateTeamPayload): Promise<ApiResponse> => {
    const { data } = await api.patch<ApiResponse>(`/department-manager/team/${id}`, payload);
    return data;
  },

  /** Toggle team status */
  toggleTeamStatus: async (id: string | number): Promise<ApiResponse> => {
    const { data } = await api.patch<ApiResponse>(`/department-manager/team/${id}/status`);
    return data;
  },

  /** Change Team Leader */
  changeTeamLead: async (id: string | number, teamLead: string): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>(`/department-manager/team/${id}/change-lead`, { teamLead });
    return data;
  },

  /** Remove team member */
  removeTeamMember: async (memberId: string | number): Promise<ApiResponse> => {
    const { data } = await api.delete<ApiResponse>(`/department-manager/team/members/${memberId}`);
    return data;
  },

  // ─── 3. Team Leader Operations ──────────────────────────────────────────────
  /** Get Team Leader's direct team overview */
  getTeamOverview: async (): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>("/team-leader/my-team");
    return data;
  },

  /** Get employee profile and task load */
  getEmployeeProfile: async (id: string | number): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>(`/team-leader/my-team/employees/${id}`);
    return data;
  },

  /** Assign document or task to employee */
  assignWork: async (payload: AssignWorkPayload): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>("/team-leader/my-team/assign-work", payload);
    return data;
  },

  /** Send broadcast/direct message to employee */
  sendMessage: async (payload: { employeeId: string | number; message: string; subject?: string }): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>("/team-leader/my-team/send-message", payload);
    return data;
  },
};

export const orgTeamApi = {
  getUsers: async (): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>("/org-admin/team/users");
    return data;
  },
  createUser: async (userData: any): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>("/org-admin/team/users", userData);
    return data;
  },
  updateUser: async (id: number | string, dataObj: any): Promise<ApiResponse> => {
    const { data } = await api.put<ApiResponse>(`/org-admin/team/users/${id}`, dataObj);
    return data;
  },
  toggleUserStatus: async (id: number | string, status: string): Promise<ApiResponse> => {
    const { data } = await api.patch<ApiResponse>(`/org-admin/team/users/${id}/status`, { status });
    return data;
  },
  deleteUser: async (id: number | string): Promise<ApiResponse> => {
    const { data } = await api.delete<ApiResponse>(`/org-admin/team/users/${id}`);
    return data;
  },
  inviteUser: async (inviteData: any): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>("/org-admin/team/users/invite", inviteData);
    return data;
  },
  resendInvite: async (email: string): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>("/org-admin/team/users/resend-invite", { email });
    return data;
  },
  getPermissionsMatrix: async (): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>("/org-admin/team/permissions");
    return data;
  },
  getDepartments: async (): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>("/org-admin/team/departments");
    return data;
  },
  createDepartment: async (deptData: any): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>("/org-admin/team/departments", deptData);
    return data;
  },
  deleteDepartment: async (id: number | string): Promise<ApiResponse> => {
    const { data } = await api.delete<ApiResponse>(`/org-admin/team/departments/${id}`);
    return data;
  },
  getTeams: async (): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>("/org-admin/team/teams");
    return data;
  },
  createTeam: async (teamData: { name: string; department: string; teamLead: string }): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>("/org-admin/team/teams", teamData);
    return data;
  },
  getUserActivityLog: async (): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>("/org-admin/team/activity");
    return data;
  },
};

export default teamsApi;
