import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../api/axios";
import type { MenuItem } from "../../types";

export const useMenus = (params?: { restaurantId?:string; q?:string; category?:string; sort?:string; page?:number; limit?:number }) =>
  useQuery({ queryKey:["menus", params], queryFn:()=>apiGet<MenuItem[]>("menus", params) });
