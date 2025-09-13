import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useRestaurants } from "@/services/queries/restaurants";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppDispatch, useAppSelector } from "@/features/store";
import type { RootState } from "@/features/store";
import { setPrice, setRating } from "@/features/filters/filtersSlice";
import { useGeolocation } from "@/hooks/useGeolocation";
import RestaurantCard from "@/components/RestaurantCard";
import { useMemo, useState } from "react";

export default function Categories() {
  const f = useAppSelector((s: RootState) => s.filters);
  const d = useAppDispatch();

  // Local controlled inputs for price to avoid dispatching on each keystroke
  const [min, setMin] = useState<string>(f.minPrice?.toString() ?? "");
  const [max, setMax] = useState<string>(f.maxPrice?.toString() ?? "");

  const minPrice = useMemo(() => (min.trim() ? Number(min) : undefined), [min]);
  const maxPrice = useMemo(() => (max.trim() ? Number(max) : undefined), [max]);

  const { data, isLoading, isError } = useRestaurants({
    q: f.q,
    page: 1,
    limit: 24,
    rating: f.rating,
    priceMin: minPrice,
    priceMax: maxPrice,
    sort: 'rating_desc',
  });

  const applyPrice = () => d(setPrice({ min: minPrice, max: maxPrice }));
  const geo = useGeolocation();

  return (
    <>
      <Navbar />
      <section className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold">All Restaurant</h1>

        <div className="mt-6 grid grid-cols-12 gap-6">
          {/* Sidebar Filters */}
          <aside className="col-span-12 md:col-span-3">
            <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-4">
              <div className="text-sm font-semibold text-zinc-800">FILTER</div>

              <div className="mt-4">
                <div className="text-sm font-medium text-zinc-700 mb-2">Distance</div>
                {/* Visual only for now */}
                <div className="space-y-2 text-sm text-zinc-700">
                  {['Nearby', 'Within 1 km', 'Within 3 km', 'Within 5 km'].map((label, i) => (
                    <label key={label} className="flex items-center gap-2">
                      <input type="checkbox" className="accent-[var(--color-brand,#D22B21)]" disabled={i!==0} defaultChecked={i===0} />
                      <span className={i!==0? 'text-zinc-400':'text-zinc-700'}>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <div className="text-sm font-medium text-zinc-700 mb-2">Price</div>
                <div className="space-y-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">Rp</span>
                    <Input
                      inputMode="numeric"
                      value={min}
                      onChange={(e)=>setMin(e.target.value.replace(/[^0-9]/g,''))}
                      placeholder="Minimum Price"
                      className="pl-9"
                    />
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">Rp</span>
                    <Input
                      inputMode="numeric"
                      value={max}
                      onChange={(e)=>setMax(e.target.value.replace(/[^0-9]/g,''))}
                      placeholder="Maximum Price"
                      className="pl-9"
                    />
                  </div>
                  <button onClick={applyPrice} className="w-full mt-1 text-sm rounded-md bg-[var(--color-brand,#D22B21)] text-white py-2">Apply</button>
                </div>
              </div>

              <div className="mt-6">
                <div className="text-sm font-medium text-zinc-700 mb-2">Rating</div>
                <div className="space-y-2 text-sm">
                  {[5,4,3,2,1].map((r) => (
                    <label key={r} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="rating"
                        className="accent-[var(--color-brand,#D22B21)]"
                        checked={f.rating === r}
                        onChange={()=>d(setRating(r))}
                      />
                      <span className="text-zinc-700">{Array.from({length:r}).map(()=>"⭐").join(' ')} & up</span>
                    </label>
                  ))}
                  <label className="flex items-center gap-2">
                    <input type="radio" name="rating" className="accent-[var(--color-brand,#D22B21)]" checked={f.rating === undefined} onChange={()=>d(setRating(undefined))} />
                    <span className="text-zinc-700">Any rating</span>
                  </label>
                </div>
              </div>
            </div>
          </aside>

          {/* Results grid */}
          <div className="col-span-12 md:col-span-9">
            {isLoading && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({length:9}).map((_,i)=>(<Skeleton key={i} className="h-56 rounded-xl"/>))}
              </div>
            )}
            {isError && <div className="text-red-600">Failed to load restaurants.</div>}
            {data && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.map((r)=> (
                  <RestaurantCard key={r.id} restaurant={r} userPos={geo.position ?? undefined} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
