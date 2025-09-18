import { useQuery } from "@tanstack/react-query";
import { apiGet, API_ORIGIN } from "../api/axios";

type MenuImageRequest = {
  restaurantId: string;
  menuIds: string[];
};

type MenuApi = {
  id?: number | string;
  image?: string | null;
  imageUrl?: string | null;
};

type RestoDetailResponse = {
  data?: {
    id?: number | string;
    menus?: MenuApi[];
    sampleMenus?: MenuApi[];
  };
};

function toAbsolute(u?: string | null): string | undefined {
  if (!u) return undefined;
  if (/^(https?:)?\/\//i.test(u) || /^data:/i.test(u)) {
    return u.startsWith('//') ? `https:${u}` : u;
  }
  if (API_ORIGIN) {
    const sep = u.startsWith('/') ? '' : '/';
    return `${API_ORIGIN}${sep}${u}`;
  }
  return u;
}

function normalizeRequests(requests: MenuImageRequest[]): MenuImageRequest[] {
  const merged = new Map<string, Set<string>>();
  for (const req of requests) {
    if (!req.restaurantId) continue;
    const rid = req.restaurantId;
    const current = merged.get(rid) ?? new Set<string>();
    for (const id of req.menuIds) {
      if (id) current.add(id);
    }
    if (current.size > 0) merged.set(rid, current);
  }
  return Array.from(merged.entries()).map(([restaurantId, set]) => ({
    restaurantId,
    menuIds: Array.from(set.values()),
  }));
}

export const useRestaurantMenuImages = (
  requests: MenuImageRequest[],
  options?: { enabled?: boolean }
) => {
  const normalized = normalizeRequests(requests);
  return useQuery<Map<string, string>>({
    queryKey: [
      "restaurant-menu-images",
      normalized.map((r) => [r.restaurantId, [...r.menuIds].sort()].join(':')).sort(),
    ],
    enabled: (options?.enabled ?? true) && normalized.length > 0,
    queryFn: async () => {
      const imageMap = new Map<string, string>();
      await Promise.allSettled(
        normalized.map(async ({ restaurantId, menuIds }) => {
          try {
            const params = { limitMenu: Math.min(50, Math.max(menuIds.length, 10)) } as Record<string, unknown>;
            const res = await apiGet<RestoDetailResponse>(`resto/${restaurantId}`, params);
            const menus = res?.data?.menus ?? res?.data?.sampleMenus ?? [];
            const lookup = new Set(menuIds.map(String));
            for (const m of menus) {
              const mid = m?.id;
              if (mid === undefined || mid === null) continue;
              const key = String(mid);
              if (!lookup.has(key)) continue;
              const img = toAbsolute(m.image ?? m.imageUrl ?? undefined);
              if (img) imageMap.set(key, img);
            }
          } catch (e) {
            if (import.meta.env.DEV) {
              console.debug('[menu-images] failed loading images', restaurantId, e);
            }
          }
        })
      );
      return imageMap;
    },
    placeholderData: () => new Map<string, string>(),
  });
};
