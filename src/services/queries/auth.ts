import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut } from "../api/axios";
import { showToast } from "@/lib/toast";

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
        } catch {
          // no-op in non-DOM environments
          void 0;
        }
        qc.invalidateQueries();
      },
    });
  };

export const useRegister = () =>
  useMutation({ mutationFn: (body: Creds) => apiPost<{ success:boolean; data?: unknown; message?: string }>("auth/register", body) });

type ProfileResponse = {
  success?: boolean; message?: string; data?: { id?: number|string; name?: string; email?: string; phone?: string };
};

export const useProfile = () =>
  useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await apiGet<ProfileResponse>("auth/profile");
      const d = res?.data ?? {};
      return { id: d.id, name: d.name ?? "", email: d.email ?? "", phone: d.phone ?? "" } as { id?: number|string; name: string; email: string; phone: string };
    }
  });

export const useUpdateProfile = () =>
  useMutation({
    mutationFn: async (body: { name?: string; phone?: string; currentPassword?: string; newPassword?: string }) =>
      apiPut<ProfileResponse>("auth/profile", body),
    onSuccess: (res) => {
      showToast(res?.message || "Profile updated", 'success');
    }
  });
