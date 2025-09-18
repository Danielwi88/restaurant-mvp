import { useMutation, useQuery } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPost } from "../api/axios";
import type { Order, CartItem } from "../../types";
import { showToast } from "@/lib/toast";

type OrdersApiResponse = {
  success?: boolean;
  message?: string;
  data?: {
    orders?: Array<{
      id?: number | string;
      transactionId?: string;
      status?: string;
      paymentMethod?: string;
      pricing?: { subtotal?: number; serviceFee?: number; deliveryFee?: number; totalPrice?: number };
      restaurants?: Array<{
        restaurantId?: number | string;
        restaurantName?: string;
        items?: Array<{ menuId?: number | string; menuName?: string; price?: number; quantity?: number; itemTotal?: number }>;
        subtotal?: number;
      }>;
      createdAt?: string;
      updatedAt?: string;
    }>;
  };
};
type CheckoutResponse = { data?: Order };
type AddCartBody = { restaurantId: number | string; menuId: number | string; quantity: number };
export type AddCartResponse = {
  success?: boolean;
  message?: string;
  data?: {
    cartItem?: {
      id?: number | string;
      restaurant?: { id?: number | string; name?: string; logo?: string };
      menu?: { id?: number | string; foodName?: string; price?: number; type?: string; image?: string };
      quantity?: number;
      itemTotal?: number;
    }
  }
};

type RemoveCartResponse = { success?: boolean; message?: string; data?: null };

export const useOrders = (params?: { status?:string }) =>
  useQuery({
    queryKey:["orders", params],
    queryFn: async () => {
      const res = await apiGet<OrdersApiResponse>("order/my-order", params);
      const raw = res?.data?.orders ?? [];
      const mapped: Order[] = raw.map((o) => {
        const items: CartItem[] = (o.restaurants ?? []).flatMap((r) =>
          (r.items ?? []).map((it) => ({
            id: String(it.menuId ?? ""),
            name: String(it.menuName ?? "Item"),
            price: Number(it.price ?? 0),
            qty: Number(it.quantity ?? 0),
          }))
        );
        const total = Number(o.pricing?.totalPrice ?? 0);
        const firstR = (o.restaurants ?? [])[0];
        const statusStr = String(o.status ?? "DONE").toUpperCase();
        const status = (statusStr === "ON_THE_WAY" || statusStr === "DELIVERED" || statusStr === "PREPARING" || statusStr === "DONE" || statusStr === "CANCELED")
          ? (statusStr as Order["status"]) : "DONE";
        return {
          id: String(o.id ?? ""),
          items,
          total,
          customerName: "",
          phone: "",
          address: "",
          createdAt: o.createdAt ? String(o.createdAt) : new Date().toISOString(),
          status,
          transactionId: o.transactionId ? String(o.transactionId) : undefined,
          restaurantId: firstR?.restaurantId !== undefined ? String(firstR.restaurantId) : undefined,
          restaurantName: firstR?.restaurantName ? String(firstR.restaurantName) : undefined,
        } as Order;
      });
      return mapped;
    },
    refetchOnMount: "always",
  });

export const useCreateOrder = () =>
  useMutation({
    mutationFn: async (body: { items: {id:string; qty:number}[]; customerName:string; phone:string; address:string }) => {
      const res = await apiPost<CheckoutResponse>("order/checkout", body);
      return res?.data as Order;
    },
  });

// POST /cart to add a single menu item to the server cart
export const useAddCartItem = () =>
  useMutation({
    mutationFn: async (body: AddCartBody) => {
      
      const res = await apiPost<AddCartResponse>("cart", body);
      return res;
    },
  });

// DELETE /cart/:id to remove an item from the server cart
export const useRemoveCartItem = () =>
  useMutation({
    mutationFn: async (cartItemId: number | string) => {
      const res = await apiDelete<RemoveCartResponse>(`cart/${cartItemId}`);
      return res;
    },
    onSuccess: (res) => {
      const msg = res?.message || 'Item removed from cart successfully';
      showToast(msg, 'success');
    },
  });
