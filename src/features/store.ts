// src/features/store.ts
import { configureStore } from "@reduxjs/toolkit";
import cart from "./cart/cartSlice.ts";
import filters from "./filters/filtersSlice.ts";
import { type TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";

export const store = configureStore({ reducer: { cart, filters }});
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
