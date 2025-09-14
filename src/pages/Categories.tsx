import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useInfiniteRestaurants } from "@/services/queries/restaurants";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppDispatch, useAppSelector } from "@/features/store";
import type { RootState } from "@/features/store";
import { setPrice, setRating } from "@/features/filters/filtersSlice";
import { useGeolocation } from "@/hooks/useGeolocation";
import RestaurantCard from "@/components/RestaurantCard";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Restaurant } from "@/types";

export default function Categories() {
  const f = useAppSelector((s: RootState) => s.filters);
  const d = useAppDispatch();

  // Local controlled inputs for price to avoid dispatching on each keystroke
  const [min, setMin] = useState<string>(f.minPrice?.toString() ?? "");
  const [max, setMax] = useState<string>(f.maxPrice?.toString() ?? "");

  const minPrice = useMemo(() => (min.trim() ? Number(min) : undefined), [min]);
  const maxPrice = useMemo(() => (max.trim() ? Number(max) : undefined), [max]);

  const { data, isLoading, isError, isFetching, fetchNextPage, hasNextPage } = useInfiniteRestaurants({
    q: f.q,
    limit: 8,
    rating: f.rating,
    priceMin: minPrice,
    priceMax: maxPrice,
    sort: 'rating_desc',
  });

  // Flatten pages into a single list
  const list: Restaurant[] = useMemo(() => {
    const pages = data?.pages ?? [];
    const items = pages.flatMap(p => p.items);
    // Keep unique by id in case API overlaps
    const seen = new Set<string>();
    return items.filter((r) => {
      const id = String(r.id);
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [data]);

  // Intersection observer for infinite scroll
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasNextPage && !isFetching) {
        fetchNextPage();
      }
    }, { rootMargin: '200px' });
    io.observe(el);
    return () => io.disconnect();
  }, [fetchNextPage, hasNextPage, isFetching]);

  const applyPrice = () => d(setPrice({ min: minPrice, max: maxPrice }));
  const geo = useGeolocation();

  return (
    <>
      <Navbar />
      <section className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-semibold tracking-[-0.01em]">All Restaurant</h1>

        <div className="mt-6 grid grid-cols-12 gap-6">
          {/* Sidebar Filters */}
          <aside className="col-span-12 md:col-span-3">
            <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-4 md:sticky md:top-28">
              <div className="text-xs font-semibold tracking-wider text-zinc-500 uppercase">FILTER</div>

              <div className="mt-4">
                <div className="text-sm font-medium text-zinc-700 mb-2">Distance</div>
                {/* Visual only for now */}
                <div className="space-y-2 text-sm text-zinc-700">
                  {['Nearby', 'Within 1 km', 'Within 3 km', 'Within 5 km'].map((label, i) => (
                    <label key={label} className="flex items-center gap-2">
                      <input type="radio" name="distance" className="accent-[var(--color-brand,#D22B21)]" disabled={i!==0} defaultChecked={i===0} />
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
                      className="pl-9 placeholder:text-zinc-400"
                    />
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">Rp</span>
                    <Input
                      inputMode="numeric"
                      value={max}
                      onChange={(e)=>setMax(e.target.value.replace(/[^0-9]/g,''))}
                      placeholder="Maximum Price"
                      className="pl-9 placeholder:text-zinc-400"
                    />
                  </div>
                  <button onClick={applyPrice} className="w-full mt-1 text-sm rounded-md bg-[var(--color-brand,#D22B21)] text-white py-2 shadow-sm">Apply</button>
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
            {(isLoading && (list.length === 0)) && (
              <div className="grid sm:grid-cols-2  gap-4">
                {Array.from({length:9}).map((_,i)=>(<Skeleton key={i} className="h-56 rounded-xl"/>))}
              </div>
            )}
            {isError && <div className="text-red-600">Failed to load restaurants.</div>}
            {list && (
              <div className="grid sm:grid-cols-2 gap-4">
                {list.map((r)=> (
                  <RestaurantCard key={String(r.id)} restaurant={r} userPos={geo.position ?? undefined} />
                ))}
              </div>
            )}
            {isFetching && list.length > 0 && (
              <div className="grid sm:grid-cols-2 gap-4 mt-4">
                {Array.from({length:3}).map((_,i)=>(<Skeleton key={i} className="h-56 rounded-xl"/>))}
              </div>
            )}
            {/* Sentinel for auto-fetching next page */}
            <div ref={sentinelRef} className="h-2" />
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
