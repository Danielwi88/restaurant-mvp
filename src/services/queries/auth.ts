// src/services/queries/auth.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiPost } from "../api/axios";

type Creds = { email: string; password: string; name?: string; phone?: string };

type LoginResponse = {
  success?: boolean
  data?: { token?: string; user?: unknown }
  token?: string
};

function extractToken(d: unknown): string | undefined {
  if (d && typeof d === 'object') {
    const obj = d as LoginResponse;
    return obj.data?.token ?? obj.token;
  }
  return undefined;
}

export const useLogin = () =>
  {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: (body: Creds) => apiPost<LoginResponse>("auth/login", body),
      onSuccess: (d) => {
        const token = extractToken(d);
        if (token) localStorage.setItem("token", token);
        // Persist user (best-effort, unknown shape, no `any`)
        if (d && typeof d === 'object') {
          const root = d as Record<string, unknown>;
          const dataField = root.data;
          let user: unknown = undefined;
          if (dataField && typeof dataField === 'object') {
            user = (dataField as Record<string, unknown>).user;
          }
          if (user === undefined && "user" in root) {
            user = (root as Record<string, unknown>).user;
          }
          if (user !== undefined) {
            try {
              localStorage.setItem("user", JSON.stringify(user));
            } catch (err) {
              if (import.meta.env.DEV) console.warn("[auth] Persist user failed", err);
            }
          }
        }
        // Notify app that auth state changed so views can react
        try {
          window.dispatchEvent(new Event("auth:changed"));
        } catch (_) {
          // no-op in non-DOM environments
        }
        qc.invalidateQueries();
      },
    });
  };

export const useRegister = () =>
  useMutation({ mutationFn: (body: Creds) => apiPost<{ success:boolean; data?: unknown; message?: string }>("auth/register", body) });
