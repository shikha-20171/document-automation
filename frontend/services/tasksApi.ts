import api, { type ApiResponse } from "./api";
import type { CreateTaskPayload, TaskFilters, UpdateTaskPayload } from "./types/task";

export const tasksApi = {
  // ─── 1. Employee Task Operations ──────────────────────────────────────────────
  /** View assigned tasks with status, priority, and search filters */
  getTasks: async (params?: TaskFilters, basePath = "/employee/tasks"): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>(basePath, { params });
    return data;
  },

  /** Alias for employee tasks */
  getMyTasks: async (params?: TaskFilters): Promise<ApiResponse> => {
    return tasksApi.getTasks(params, "/employee/tasks");
  },

  /** Update task status with optional completion proof/attachments & comments */
  updateTaskStatus: async (
    id: string | number,
    status: string,
    payload?: { comment?: string; attachments?: any[] }
  ): Promise<ApiResponse> => {
    const { data } = await api.patch<ApiResponse>(`/employee/tasks/${id}/status`, { status, ...payload });
    return data;
  },

  /** Add comment or threaded reply to task */
  addTaskComment: async (
    id: string | number,
    data: string | { text: string; replyToId?: string }
  ): Promise<ApiResponse> => {
    const body = typeof data === "string" ? { text: data } : data;
    const { data: response } = await api.post<ApiResponse>(`/employee/tasks/${id}/comments`, body);
    return response;
  },

  /** Attach deliverable file to task */
  addTaskAttachment: async (
    id: string | number,
    attachment: { name: string; size: string; type?: string }
  ): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>(`/employee/tasks/${id}/attachments`, attachment);
    return data;
  },

  // ─── 2. Team Leader / Management Task Operations ────────────────────────────
  /** Get tasks assigned to team members */
  getTeamTasks: async (params?: TaskFilters): Promise<ApiResponse> => {
    return tasksApi.getTasks(params, "/team-leader/tasks");
  },

  /** Create and assign task to employee */
  createTask: async (payload: CreateTaskPayload): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>("/team-leader/tasks", payload);
    return data;
  },

  /** Update task parameters, priority, timeline, or reassign */
  updateTask: async (id: string | number, payload: UpdateTaskPayload): Promise<ApiResponse> => {
    const { data } = await api.patch<ApiResponse>(`/team-leader/tasks/${id}`, payload);
    return data;
  },
};

export default tasksApi;
