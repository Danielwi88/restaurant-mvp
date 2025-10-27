import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { apiGet, API_ORIGIN } from "../api/axios";
import type { Restaurant, MenuItem } from "../../types";
import type { AxiosError } from "axios";

type RestaurantApi = {
  id: number | string
  name: string
  place?: string
  address?: string
  logo?: string
  logoUrl?: string
  images?: string[]
  bannerUrls?: string[]
  star?: number
  averageRating?: number
  rating?: number
  distance?: number
  distanceKm?: number
  coordinates?: { lat?: number; long?: number; lng?: number; lon?: number; latitude?: number; longitude?: number }
  lat?: number
  long?: number
  lng?: number
  lon?: number
  latitude?: number
  longitude?: number
}

type MenuApi = {
  id: number | string
  foodName?: string
  name?: string
  price?: number | string
  type?: string
  categoryId?: string
  image?: string
  imageUrl?: string
}

type RestoListResponse = { data?: { restaurants?: RestaurantApi[] } }
type ReviewApi = {
  id: number | string
  star?: number
  rating?: number
  comment?: string
  createdAt?: string
  user?: { id?: number | string; name?: string; avatar?: string; avatarUrl?: string }
}

type RestoDetailResponse = { data?: RestaurantApi & { sampleMenus?: MenuApi[]; menus?: MenuApi[]; reviews?: ReviewApi[] } }
type RestoRecommendedResponse = { data?: { recommendations?: RestaurantApi[] } }

// Map API restaurant shape to app Restaurant type
function toAbsolute(u?: string): string | undefined {
  if (!u) return undefined;
  // Already absolute or data URL
  if (/^(https?:)?\/\//i.test(u) || /^data:/i.test(u)) {
    return u.startsWith('//') ? `https:${u}` : u;
  }
  // If we know the API origin, prefix relative paths to load from the API host
  if (API_ORIGIN) {
    const sep = u.startsWith('/') ? '' : '/';
    return `${API_ORIGIN}${sep}${u}`;
  }
  return u;
}

function mapRestaurant(api: RestaurantApi): Restaurant {
  const lat = api.coordinates?.lat ?? api.coordinates?.latitude ?? api.lat ?? api.latitude;
  const lng = api.coordinates?.long ?? api.coordinates?.lng ?? api.coordinates?.longitude ?? api.long ?? api.lng ?? api.lon ?? api.longitude;
  const distRaw = (api as unknown as Record<string, unknown>);
  const distCandidateUnknown = (() => {
    // Probe various API field names without using `any`
    const keys = [
      "distance",
      "distanceKm",
      "distance_km",
      "distanceKM",
      "distanceInKm",
      "distance_in_km",
    ] as const;
    for (const k of keys) {
      const v = distRaw[k as unknown as string];
      if (v != null) return v;
    }
    return undefined as unknown;
  })();
  const distCandidate = distCandidateUnknown != null ? Number(distCandidateUnknown as number) : undefined;
  return {
    id: String(api.id),
    name: api.name,
    address: api.place ?? api.address,
    logoUrl: toAbsolute(api.logo ?? api.logoUrl),
    bannerUrls: (api.images ?? api.bannerUrls)?.map((s) => toAbsolute(s)!) ?? undefined,
    rating: api.star ?? api.averageRating ?? api.rating,
    distanceKm: distCandidate != null ? Number(distCandidate as number) : undefined,
    coords: lat != null && lng != null ? { lat: Number(lat), long: Number(lng) } : undefined,
  };
}

function mapMenuItem(api: MenuApi, restaurantId?: string): MenuItem {
  return {
    id: String(api.id),
    name: String(api.foodName ?? api.name ?? ""),
    price: Number(api.price ?? 0),
    imageUrl: toAbsolute(api.image ?? api.imageUrl),
    categoryId: String(api.type ?? api.categoryId ?? ""),
    restaurantId,
  };
}

export const useRestaurants = (params?: { q?:string; page?:number; limit?:number; rating?:number; priceMin?:number; priceMax?:number; sort?: 'rating_desc' | 'price_asc' | 'price_desc' | 'newest' }) =>
  useQuery({
    queryKey:["restaurants", params],
    placeholderData: (prev) => prev,
    queryFn: async () => {
      const qp: Record<string, unknown> = {
        page: params?.page,
        limit: params?.limit,
        rating: params?.rating,
        priceMin: params?.priceMin,
        priceMax: params?.priceMax,
      };
      const query = params?.q?.trim();
      if (query) {
        // Send both `q` and `location` to maximize compatibility across API variants
        qp.q = query;
        qp.location = query;
      }
      const res = await apiGet<RestoListResponse>("resto", qp);
      const list = res?.data?.restaurants ?? [];
      return list.map(mapRestaurant) as Restaurant[];
    },
    select: (data) => {
      const query = params?.q?.trim()?.toLowerCase();
      let out = data;
      if (query) {
        
        out = out.filter((r) =>
          (r.name?.toLowerCase().includes(query) || r.address?.toLowerCase().includes(query))
        );
      }
      // Apply simple client-side sorting
      if (params?.sort === 'rating_desc') {
        out = [...out].sort((a,b) => (b.rating ?? 0) - (a.rating ?? 0));
      }
      return out;
    }
  });

export const useRestaurant = (id?: string, params?: { limitMenu?: number; limitReview?: number }) =>
  useQuery({
    enabled: !!id,
    queryKey:["restaurant", id, params],
    placeholderData: (prev) => prev,
    queryFn: async () => {
      const res = await apiGet<RestoDetailResponse>(`resto/${id}`,(params ?? undefined));
      const data = res?.data;
      if (!data) {
        return { restaurant: undefined, sampleMenus: [] as MenuItem[], reviews: [] as ReviewApi[] } as {
          restaurant?: Restaurant;
          sampleMenus: MenuItem[];
          reviews: ReviewApi[];
        };
      }
      return {
        restaurant: mapRestaurant(data),
        sampleMenus: Array.isArray(data.sampleMenus ?? data.menus)
          ? (data.sampleMenus ?? data.menus)!.map((m) => mapMenuItem(m, String(data.id)))
          : ([] as MenuItem[]),
        reviews: Array.isArray(data.reviews) ? data.reviews : ([] as ReviewApi[]),
      } as { restaurant?: Restaurant; sampleMenus: MenuItem[]; reviews: ReviewApi[] };
    }
  });

export const useRecommendedRestaurants = (options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: ["restaurants", "recommended"],
    enabled: options?.enabled ?? true,
    placeholderData: (prev) => prev,
    retry: (failureCount, error) => {
      const status = (error as AxiosError | undefined)?.response?.status;
      if (status === 401 || status === 403) return false;
      return failureCount < 3;
    },
    queryFn: async () => {
      const hasToken =
        typeof window !== "undefined" ? !!localStorage.getItem("token") : false;
      if (!hasToken) {
        return [] as Restaurant[];
      }
      try {
        const res = await apiGet<RestoRecommendedResponse>("resto/recommended");
        const list = res?.data?.recommendations ?? [];
        return list.map(mapRestaurant) as Restaurant[];
      } catch (err) {
        const status = (err as AxiosError | undefined)?.response?.status;
        if (status === 401 || status === 403) {
          return [] as Restaurant[];
        }
        throw err;
      }
    },
  });

export const useInfiniteRestaurants = (params?: { q?:string; limit?:number; rating?:number; priceMin?:number; priceMax?:number; sort?: 'rating_desc' | 'price_asc' | 'price_desc' | 'newest' }) =>
  useInfiniteQuery({
    queryKey: ["restaurants", "infinite", params],
    initialPageParam: 1,
    getNextPageParam: (lastPage: { items: Restaurant[]; hasMore: boolean }, _pages, lastPageParam) =>
      lastPage.hasMore ? (Number(lastPageParam) + 1) : undefined,
    placeholderData: (prev) => prev,
    queryFn: async ({ pageParam }) => {
      const limit = params?.limit ?? 8;
      const qp: Record<string, unknown> = {
        page: pageParam,
        limit,
        rating: params?.rating,
        priceMin: params?.priceMin,
        priceMax: params?.priceMax,
      };
      const query = params?.q?.trim();
      if (query) {
        qp.q = query;
        qp.location = query;
      }
      const res = await apiGet<RestoListResponse>("resto", qp);
      const list = (res?.data?.restaurants ?? []).map(mapRestaurant) as Restaurant[];
      // Client-side fallbacks: filter + sort
      let out = list;
      if (query) {
        const ql = query.toLowerCase();
        out = out.filter((r) => (r.name?.toLowerCase().includes(ql) || r.address?.toLowerCase().includes(ql)));
      }
      if (params?.sort === 'rating_desc') {
        out = [...out].sort((a,b) => (b.rating ?? 0) - (a.rating ?? 0));
      }
      // Enforce page size on the client to guarantee exactly `limit` items per page
      const hasMore = out.length >= limit;
      const pageItems = out.slice(0, limit);
      return { items: pageItems, hasMore } as { items: Restaurant[]; hasMore: boolean };
    }
  });
