import Axios from "axios";

function normalizeBaseUrl(input: string | undefined): string {
  const raw = (input ?? "").trim();
  if (!raw) return "";
  try {
    // If input is absolute (with protocol), extract origin only
    const u = new URL(raw);
    return u.origin;
  } catch {
    // Fallback: strip any trailing slashes and path fragments like /api-swagger
    return raw.replace(/\/+$/g, "").replace(/\/.+$/, "");
  }
}

function normalizePrefix(input: string | undefined): string {
  const raw = (input ?? "").trim();
  if (!raw) return ""; // allow empty prefix
  const trimmed = raw.replace(/^\/+|\/+$/g, "");
  return trimmed ? `/${trimmed}` : "";
}

function extractErrorMessage(payload: unknown): string | undefined {
  if (!payload) return undefined;
  if (typeof payload === "string") {
    const txt = payload.trim();
    return txt.length ? txt : undefined;
  }
  if (typeof payload === "object") {
    const obj = payload as Record<string | number | symbol, unknown>;
    const keys = ["message", "error", "detail", "title"] as const;
    for (const key of keys) {
      const value = obj[key];
      if (typeof value === "string" && value.trim()) return value;
    }
    const errorsField = obj["errors"];
    if (Array.isArray(errorsField) && errorsField.length > 0) {
      const first = errorsField[0];
      if (typeof first === "string" && first.trim()) return first;
      if (first && typeof first === "object") {
        const nested = first as Record<string, unknown>;
        for (const value of Object.values(nested)) {
          if (typeof value === "string" && value.trim()) return value;
        }
      }
    }
  }
  return undefined;
}

const base = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL);
const prefix = normalizePrefix(import.meta.env.VITE_API_PREFIX ?? "/api");


export const API_ORIGIN = base;
export const API_PREFIX = prefix;

const axios = Axios.create({
  
  baseURL: `${base}${prefix}`,
});

if (import.meta.env.DEV) {
 
  console.info("[api] baseURL:", axios.defaults.baseURL);
}

// Ensure APIs receive JSON by default
axios.defaults.headers.common["Accept"] = "application/json";

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = (error?.response?.status ?? 0) as number;
    if (status === 401 || status === 403) {
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.dispatchEvent(new Event("auth:changed"));
        } catch {
          // Ignore storage access issues (e.g., privacy mode)
        }
      }
    }
    const message =
      extractErrorMessage(error?.response?.data) ?? extractErrorMessage(error?.message);
    if (message && error instanceof Error) {
      error.message = message;
    }
    if (message && !(error instanceof Error)) {
      return Promise.reject(new Error(message));
    }
    return Promise.reject(error);
  }
);

export default axios;

export const apiGet = <T>(url: string, params?: unknown) =>
  axios.get<T>(url, { params }).then(r => r.data);
export const apiPost = <T>(url: string, data?: unknown) =>
  axios.post<T>(url, data).then(r => r.data);
export const apiPut = <T>(url: string, data?: unknown) =>
  axios.put<T>(url, data).then(r => r.data);
export const apiDelete = <T>(url: string) =>
  axios.delete<T>(url).then(r => r.data);
