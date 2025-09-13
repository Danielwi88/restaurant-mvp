import { useQuery } from "@tanstack/react-query";
import { apiGet, API_ORIGIN } from "../api/axios";
import type { MenuItem } from "../../types";

type RestoListResponse = { data?: { restaurants?: Array<{ id: number | string }> } };
type RestoDetailResponse = { data?: { id: number | string; sampleMenus?: Array<{ id: number | string; foodName?: string; name?: string; price?: number | string; type?: string; image?: string; imageUrl?: string; }> } };

function toAbsolute(u?: string): string | undefined {
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

function mapMenuItem(api: { id: number | string; foodName?: string; name?: string; price?: number | string; type?: string; image?: string; imageUrl?: string; }, restaurantId?: string): MenuItem {
  return {
    id: String(api.id),
    name: String(api.foodName ?? api.name ?? ""),
    price: Number(api.price ?? 0),
    imageUrl: toAbsolute(api.image ?? api.imageUrl),
    categoryId: String(api.type ?? ""),
    restaurantId,
  };
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
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
        const res = await apiGet<RestoDetailResponse>(`resto/${params.restaurantId}`, { limitMenu: limit, limitReview: 6 });
        const menus = res?.data?.sampleMenus ?? [];
        return menus.map((m) => mapMenuItem(m, String(res?.data?.id ?? params.restaurantId)));
      }

      
      const [withQ, generic, more] = await Promise.all([
        apiGet<RestoListResponse>("resto", q ? { q, location: q, page: 1, limit: 12 } : { page: 1, limit: 8 }),
        q ? apiGet<RestoListResponse>("resto", { page: 1, limit: 12 }) : Promise.resolve(undefined),
        q ? apiGet<RestoListResponse>("resto", { page: 2, limit: 12 }) : Promise.resolve(undefined),
      ]);
      const ids = new Set<string>();
      const ordered = [
        ...(withQ?.data?.restaurants ?? []),
        ...((generic?.data?.restaurants ?? [])),
        ...((more?.data?.restaurants ?? []))
      ]
        .map(r => String(r.id))
        .filter((id) => {
          if (ids.has(id)) return false; ids.add(id); return true;
        })
        .slice(0, q ? 12 : 6);

      // Some restaurant IDs might not support certain params. Fetch defensively and ignore failures.
      // When searching by keyword, request more menu items per restaurant to improve recall
      const detailParams = { limitMenu: q ? Math.max(30, limit) : limit, limitReview: 6 } as Record<string, unknown>;
      const items: MenuItem[] = [];
      // Fetch details in batches to avoid overwhelming the API
      for (const group of chunk(ordered, 12)) {
        const detailResults = await Promise.allSettled(
          group.map((rid) => apiGet<RestoDetailResponse>(`resto/${rid}`, detailParams))
        );
        for (const r of detailResults) {
          if (r.status !== 'fulfilled') continue;
          const d = r.value;
          const rid = d?.data?.id ? String(d.data.id) : undefined;
          const menus = (d?.data?.sampleMenus ?? (d as unknown as { data?: { menus?: Array<{ id: number | string; foodName?: string; name?: string; price?: number | string; type?: string; image?: string; imageUrl?: string; }> } }).data?.menus) ?? [];
          for (const m of menus) items.push(mapMenuItem(m, rid));
        }
      }

      // Optional text filter by name/category
      let filtered = q ? items.filter((m) => {
        const qq = q.toLowerCase();
        return m.name.toLowerCase().includes(qq) || (m.categoryId ?? '').toLowerCase().includes(qq);
      }) : items;

      // If no results found by scanning a subset, broaden the search to more restaurants (paged)
      if ((filtered.length === 0) && q) {
        const PAGE_SIZE = 20;
        const MAX_PAGES = 8; // scan up to ~160 restaurants as a fallback
        const allIds = new Set<string>(ordered);
        for (let page = 1; page <= MAX_PAGES; page++) {
          const res = await apiGet<RestoListResponse>("resto", { page, limit: PAGE_SIZE });
          const list = res?.data?.restaurants ?? [];
          for (const r of list) allIds.add(String(r.id));
          if (list.length < PAGE_SIZE) break; // reached the end
        }
        const expanded = Array.from(allIds.values());
        const expandedItems: MenuItem[] = [];
        const expandedDetailParams = { limitMenu: 100, limitReview: 0 } as Record<string, unknown>;
        for (const group of chunk(expanded, 12)) {
          const detailResults = await Promise.allSettled(
            group.map((rid) => apiGet<RestoDetailResponse>(`resto/${rid}`, expandedDetailParams))
          );
          for (const r of detailResults) {
            if (r.status !== 'fulfilled') continue;
            const d = r.value;
            const rid = d?.data?.id ? String(d.data.id) : undefined;
            const menus = (d?.data?.sampleMenus ?? (d as unknown as { data?: { menus?: Array<{ id: number | string; foodName?: string; name?: string; price?: number | string; type?: string; image?: string; imageUrl?: string; }> } }).data?.menus) ?? [];
            for (const m of menus) expandedItems.push(mapMenuItem(m, rid));
          }
        }
        filtered = expandedItems.filter((m) => {
          const qq = q.toLowerCase();
          return m.name.toLowerCase().includes(qq) || (m.categoryId ?? '').toLowerCase().includes(qq);
        });
      }
      return filtered.slice(0, limit);
    }
  });
