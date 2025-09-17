import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../api/axios";
import type { CartItem } from "@/types";

type CartApiResponse = {
  success?: boolean;
  message?: string;
  data?: {
    cart?: Array<{
      restaurant?: {
        id?: number | string;
        name?: string;
        logo?: string | null;
      };
      items?: Array<{
        id?: number | string;
        menu?: {
          id?: number | string;
          foodName?: string;
          price?: number;
          type?: string;
          image?: string | null;
        };
        quantity?: number;
        itemTotal?: number;
      }>;
      subtotal?: number;
    }>;
    summary?: {
      totalItems?: number;
      totalPrice?: number;
      restaurantCount?: number;
    };
  };
};

export type ServerCartRestaurant = {
  restaurantId?: string;
  restaurantName?: string;
  logoUrl?: string;
  subtotal: number;
  items: CartItem[];
};

export type ServerCartSnapshot = {
  restaurants: ServerCartRestaurant[];
  items: CartItem[];
  summary?: {
    totalItems?: number;
    totalPrice?: number;
    restaurantCount?: number;
  };
};

export const useServerCart = (enabled = true) =>
  useQuery({
    queryKey: ["server-cart"],
    enabled,
    queryFn: async (): Promise<ServerCartSnapshot> => {
      const res = await apiGet<CartApiResponse>("cart");
      const rawRestaurants = res?.data?.cart ?? [];

      const restaurants = rawRestaurants.map<ServerCartRestaurant>((entry) => {
        const restaurantId = entry.restaurant?.id !== undefined
          ? String(entry.restaurant.id)
          : undefined;
        const restaurantName = entry.restaurant?.name ?? undefined;
        const logoUrl = typeof entry.restaurant?.logo === "string"
          ? entry.restaurant.logo
          : undefined;

        const items = (entry.items ?? [])
          .map<CartItem | null>((item) => {
            const menuId = item.menu?.id ?? item.id;
            if (menuId === undefined || menuId === null) return null;
            const id = String(menuId);
            const price = Number(item.menu?.price ?? item.itemTotal ?? 0);
            const qty = Number(item.quantity ?? 0);

            return {
              id,
              name: item.menu?.foodName ?? "Item",
              price: Number.isFinite(price) ? price : 0,
              qty: Number.isFinite(qty) ? qty : 0,
              imageUrl: item.menu?.image ?? undefined,
              restaurantId,
              serverCartItemId: item.id !== undefined && item.id !== null
                ? String(item.id)
                : undefined,
            } satisfies CartItem;
          })
          .filter((it): it is CartItem => it !== null);

        return {
          restaurantId,
          restaurantName,
          logoUrl,
          subtotal: Number(entry.subtotal ?? 0),
          items,
        };
      });

      const items = restaurants.flatMap((r) => r.items);

      return {
        restaurants,
        items,
        summary: res?.data?.summary,
      };
    },
  });

