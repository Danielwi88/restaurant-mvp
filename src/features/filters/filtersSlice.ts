import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
export type FiltersState = { q: string; category?: string; sort?: "rating_desc"|"price_asc"|"price_desc"|"newest"; minPrice?:number; maxPrice?:number; rating?:number; };
const initialState: FiltersState = { q: "" };
const slice = createSlice({
  name: "filters",
  initialState,
  reducers: {
    setQuery:(s,a:PayloadAction<string>)=>{s.q=a.payload},
    setCategory:(s,a:PayloadAction<string|undefined>)=>{s.category=a.payload},
    setSort:(s,a:PayloadAction<FiltersState["sort"]>)=>{s.sort=a.payload},
    setPrice:(s,a:PayloadAction<{min?:number;max?:number}>)=>{s.minPrice=a.payload.min; s.maxPrice=a.payload.max},
    setRating:(s,a:PayloadAction<number|undefined>)=>{s.rating=a.payload},
    resetFilters:()=>initialState
  }
});
export const { setQuery, setCategory, setSort, setPrice, setRating, resetFilters } = slice.actions;
export default slice.reducer;
