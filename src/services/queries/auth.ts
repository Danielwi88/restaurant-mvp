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
        // Persist user (best-effort, unknown shape)
        if (d && typeof d === 'object') {
          try {
            const anyD = d as any;
            const user = anyD.data?.user ?? anyD.user ?? null;
            if (user) localStorage.setItem("user", JSON.stringify(user));
          } catch {}
        }
        qc.invalidateQueries();
      },
    });
  };

export const useRegister = () =>
  useMutation({ mutationFn: (body: Creds) => apiPost<{ success:boolean; data?: unknown; message?: string }>("auth/register", body) });
