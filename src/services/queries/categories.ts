import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../api/axios";
import type { Category } from "../../types";

export const useCategories = () =>
  useQuery({ queryKey:["categories"], queryFn:()=>apiGet<Category[]>("categories"), staleTime:60_000 });
