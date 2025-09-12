// src/features/cart/cartSlice.ts
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { CartItem } from "../../types";
import { load, save } from "../../lib/persist";

type CartState = { items: CartItem[] };
const initialState: CartState = load<CartState>("cart", { items: [] });

const slice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (s, a:PayloadAction<CartItem>) => {
      const f = s.items.find(i=>i.id===a.payload.id);
      if (f) f.qty += a.payload.qty; else s.items.push(a.payload);
      save("cart", s);
    },
    updateQty: (s, a:PayloadAction<{id:string;qty:number}>) => {
      const it = s.items.find(i=>i.id===a.payload.id);
      if (it) it.qty = Math.max(1, a.payload.qty);
      save("cart", s);
    },
    removeFromCart: (s, a:PayloadAction<string>) => {
      s.items = s.items.filter(i=>i.id!==a.payload); save("cart", s);
    },
    clearCart: (s) => { s.items = []; save("cart", s); }
  }
});
export const { addToCart, updateQty, removeFromCart, clearCart } = slice.actions;
export default slice.reducer;
