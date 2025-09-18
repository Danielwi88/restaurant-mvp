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

export default axios;

export const apiGet = <T>(url: string, params?: unknown) =>
  axios.get<T>(url, { params }).then(r => r.data);
export const apiPost = <T>(url: string, data?: unknown) =>
  axios.post<T>(url, data).then(r => r.data);
export const apiPut = <T>(url: string, data?: unknown) =>
  axios.put<T>(url, data).then(r => r.data);
export const apiDelete = <T>(url: string) =>
  axios.delete<T>(url).then(r => r.data);
