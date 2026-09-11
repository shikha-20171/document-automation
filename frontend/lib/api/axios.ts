import axios, {
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";

// ─── ONE Canonical API Base URL ───────────────────────────────────────────────
export function getApiBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    const isLocalhost =
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "0.0.0.0" ||
      host.startsWith("192.168.") ||
      host.startsWith("10.");

    if (!isLocalhost) {
      if (envUrl && envUrl.trim().startsWith("https://")) {
        const clean = envUrl.trim().replace(/\/+$/, "");
        return clean.endsWith("/api") ? clean : `${clean}/api`;
      }
      return "https://document-automation-backend-1jte.onrender.com/api";
    }
  }

  if (envUrl && envUrl.trim()) {
    const clean = envUrl.trim().replace(/\/+$/, "");
    return clean.endsWith("/api") ? clean : `${clean}/api`;
  }

  if (typeof process !== "undefined" && process.env.NODE_ENV === "production") {
    return "https://document-automation-backend-1jte.onrender.com/api";
  }

  return "http://localhost:5001/api";
}

export const API_BASE = getApiBaseUrl();

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

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
  error?: { message?: string; code?: string; details?: any } | any;
  errors?: any;
}

// ─── ONE Centralized Axios Instance ──────────────────────────────────────────
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: 180_000, // 3 min – large OCR file uploads need more time
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// ─── Request Interceptor ─────────────────────────────────────────────────────
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    config.baseURL = getApiBaseUrl();

    // Prevent duplicate /api/api prefix
    if (config.url) {
      if (config.url.startsWith("/api/")) {
        config.url = config.url.substring(4);
      } else if (config.url.startsWith("api/")) {
        config.url = "/" + config.url.substring(4);
      }
    }

    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ────────────────────────────────────────────────────
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status ?? 0;
      const data = error.response?.data as { message?: string } | undefined;
      const message = data?.message ?? error.message ?? "Something went wrong.";

      if (status === 401 && typeof window !== "undefined") {
        const path = window.location.pathname;
        const isPublic =
          path.startsWith("/auth/") ||
          path.startsWith("/accept-invitation") ||
          path === "/" ||
          path === "/pricing";

        if (!isPublic) {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("token");
          window.location.href = "/auth/login";
        }
      }

      return Promise.reject(new ApiError(message, status, data));
    }
    return Promise.reject(error);
  }
);

export const apiClient = api;
export default api;
