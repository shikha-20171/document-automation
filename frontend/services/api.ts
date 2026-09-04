import axios, {
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";

// ─── Base URL Normalizer ──────────────────────────────────────────────────────
export function getApiBaseUrl(): string {
  const envUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://localhost:5001/api";

  let clean = envUrl.trim().replace(/\/+$/, "");
  // If the URL does not already end with /api, append /api
  if (!clean.endsWith("/api")) {
    clean = `${clean}/api`;
  }
  return clean;
}

export const API_BASE = getApiBaseUrl();

// ─── Custom Error ─────────────────────────────────────────────────────────────
export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

// ─── Shared Response Wrapper ──────────────────────────────────────────────────
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
}

// ─── Central Axios Instance ───────────────────────────────────────────────────
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: 120_000, // 120s for AI processing resilience
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── Request Interceptor (attach auth token & normalize paths) ────────────────
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Prevent duplicate /api/api if a caller passed "/api/something"
    if (config.url) {
      if (config.url.startsWith("/api/")) {
        config.url = config.url.substring(4);
      } else if (config.url.startsWith("api/")) {
        config.url = "/" + config.url.substring(4);
      }
    }

    if (typeof window !== "undefined") {
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("accessToken");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor (error handling & 401 redirect) ──────────────────────
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status ?? 0;
      const data = error.response?.data as { message?: string } | undefined;
      const message =
        data?.message ?? error.message ?? "Something went wrong.";

      // 401 → clear tokens and redirect to login (client-side only)
      if (status === 401 && typeof window !== "undefined") {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("token");
        window.location.href = "/auth/login";
      }

      return Promise.reject(new ApiError(message, status, data));
    }
    return Promise.reject(error);
  }
);

// Default export and apiClient alias for backward compatibility
export const apiClient = api;
export default api;
