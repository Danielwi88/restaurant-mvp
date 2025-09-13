import { useQuery } from "@tanstack/react-query";
import { apiGet, API_ORIGIN } from "../api/axios";
import type { Restaurant, MenuItem } from "../../types";

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
  return {
    id: String(api.id),
    name: api.name,
    address: api.place ?? api.address,
    logoUrl: toAbsolute(api.logo ?? api.logoUrl),
    bannerUrls: (api.images ?? api.bannerUrls)?.map((s) => toAbsolute(s)!) ?? undefined,
    rating: api.star ?? api.averageRating ?? api.rating,
    distanceKm: api.distance ?? api.distanceKm,
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
        // Original API behavior used `location`; keep it minimal to avoid server-side validation issues.
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
        // Apply client-side filter by name/address as a fallback if server didn’t filter
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
    queryFn: async () => {
      const res = await apiGet<RestoRecommendedResponse>("resto/recommended");
      const list = res?.data?.recommendations ?? [];
      return list.map(mapRestaurant) as Restaurant[];
    },
  });
