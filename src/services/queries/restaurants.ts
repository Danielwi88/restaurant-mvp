import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../api/axios";
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
type RestoDetailResponse = { data?: RestaurantApi & { sampleMenus?: MenuApi[] } }
type RestoRecommendedResponse = { data?: { recommendations?: RestaurantApi[] } }

// Map API restaurant shape to app Restaurant type
function mapRestaurant(api: RestaurantApi): Restaurant {
  return {
    id: String(api.id),
    name: api.name,
    address: api.place ?? api.address,
    logoUrl: api.logo ?? api.logoUrl,
    bannerUrls: api.images ?? api.bannerUrls,
    rating: api.star ?? api.averageRating ?? api.rating,
    distanceKm: api.distance ?? api.distanceKm,
  };
}

function mapMenuItem(api: MenuApi, restaurantId?: string): MenuItem {
  return {
    id: String(api.id),
    name: String(api.foodName ?? api.name ?? ""),
    price: Number(api.price ?? 0),
    imageUrl: api.image ?? api.imageUrl,
    categoryId: String(api.type ?? api.categoryId ?? ""),
    restaurantId,
  };
}

export const useRestaurants = (params?: { q?:string; page?:number; limit?:number; rating?:number; priceMin?:number; priceMax?:number }) =>
  useQuery({
    queryKey:["restaurants", params],
    queryFn: async () => {
      const q: Record<string, unknown> = {
        page: params?.page,
        limit: params?.limit,
        rating: params?.rating,
        priceMin: params?.priceMin,
        priceMax: params?.priceMax,
      };
      const loc = params?.q?.trim();
      if (loc) q.location = loc; // only send when not empty
      const res = await apiGet<RestoListResponse>("resto", q);
      const list = res?.data?.restaurants ?? [];
      return list.map(mapRestaurant) as Restaurant[];
    }
  });

export const useRestaurant = (id?: string) =>
  useQuery({
    enabled: !!id,
    queryKey:["restaurant", id],
    queryFn: async () => {
      const res = await apiGet<RestoDetailResponse>(`resto/${id}`);
      const data = res?.data;
      if (!data) {
        return { restaurant: undefined, sampleMenus: [] as MenuItem[] } as {
          restaurant?: Restaurant;
          sampleMenus: MenuItem[];
        };
      }
      return {
        restaurant: mapRestaurant(data),
        sampleMenus: Array.isArray(data.sampleMenus)
          ? data.sampleMenus.map((m) => mapMenuItem(m, String(data.id)))
          : ([] as MenuItem[]),
      } as { restaurant?: Restaurant; sampleMenus: MenuItem[] };
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
