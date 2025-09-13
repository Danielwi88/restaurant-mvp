import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../api/axios";
import type { MenuItem } from "../../types";

type RestoListResponse = { data?: { restaurants?: Array<{ id: number | string }> } };
type RestoDetailResponse = { data?: { id: number | string; sampleMenus?: Array<{ id: number | string; foodName?: string; name?: string; price?: number | string; type?: string; image?: string; imageUrl?: string; }> } };

function mapMenuItem(api: { id: number | string; foodName?: string; name?: string; price?: number | string; type?: string; image?: string; imageUrl?: string; }, restaurantId?: string): MenuItem {
  return {
    id: String(api.id),
    name: String(api.foodName ?? api.name ?? ""),
    price: Number(api.price ?? 0),
    imageUrl: api.image ?? api.imageUrl,
    categoryId: String(api.type ?? ""),
    restaurantId,
  };
}

export const useMenus = (params?: { restaurantId?:string; q?:string; category?:string; sort?:string; page?:number; limit?:number }) =>
  useQuery({
    queryKey:["menus", params],
    placeholderData: (prev) => prev,
    queryFn: async () => {
      const limit = params?.limit ?? 12;
      const q = params?.q?.trim();

      // If a specific restaurant is given, read its menus from the resto detail endpoint
      if (params?.restaurantId) {
        const res = await apiGet<RestoDetailResponse>(`resto/${params.restaurantId}`, { limitMenu: limit, limitReview: 0 });
        const menus = res?.data?.sampleMenus ?? [];
        return menus.map((m) => mapMenuItem(m, String(res?.data?.id ?? params.restaurantId)));
      }

      // Aggregate menu search: fetch a small set of restaurants, then read their sample menus
      const [withQ, generic] = await Promise.all([
        apiGet<RestoListResponse>("resto", q ? { location: q, page: 1, limit: 8 } : { page: 1, limit: 8 }),
        q ? apiGet<RestoListResponse>("resto", { page: 1, limit: 8 }) : Promise.resolve(undefined)
      ]);
      const ids = new Set<string>();
      const ordered = [
        ...(withQ?.data?.restaurants ?? []),
        ...((generic?.data?.restaurants ?? []))
      ]
        .map(r => String(r.id))
        .filter((id) => {
          if (ids.has(id)) return false; ids.add(id); return true;
        })
        .slice(0, 6);

      // Some restaurant IDs might not support certain params. Fetch defensively and ignore failures.
      const params = { limitMenu: limit } as Record<string, unknown>;
      const detailResults = await Promise.allSettled(
        ordered.map((rid) => apiGet<RestoDetailResponse>(`resto/${rid}`, params))
      );

      const items: MenuItem[] = [];
      for (const r of detailResults) {
        if (r.status !== 'fulfilled') continue;
        const d = r.value;
        const rid = d?.data?.id ? String(d.data.id) : undefined;
        const menus = d?.data?.sampleMenus ?? [];
        for (const m of menus) items.push(mapMenuItem(m, rid));
      }

      // Optional text filter by name
      const filtered = q ? items.filter((m) => m.name.toLowerCase().includes(q.toLowerCase())) : items;
      return filtered.slice(0, limit);
    }
  });
