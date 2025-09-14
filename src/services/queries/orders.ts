import { useMutation, useQuery } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPost } from "../api/axios";
import type { Order } from "../../types";
import { showToast } from "@/lib/toast";

type OrdersResponse = { data?: Order[] };
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
      const res = await apiGet<OrdersResponse>("order/my-order", params);
      return res?.data ?? [];
    }
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
      // Body example: { restaurantId: 26, menuId: 32, quantity: 2 }
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
