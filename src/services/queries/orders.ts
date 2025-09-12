// src/services/queries/orders.ts
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiGet, apiPost } from "../api/axios";
import type { Order } from "../../types";

type OrdersResponse = { data?: Order[] };
type CheckoutResponse = { data?: Order };

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
