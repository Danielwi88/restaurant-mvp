import Navbar from "@/components/Navbar";
import { useRestaurants, useRecommendedRestaurants } from "@/services/queries/restaurants";
import { useMenus } from "@/services/queries/menus";
import { useAppDispatch, useAppSelector } from "@/features/store";
import type { RootState } from "@/features/store";
import { setQuery, setSort } from "@/features/filters/filtersSlice";
import type { FiltersState } from "@/features/filters/filtersSlice";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";
import { useDebounce } from "@/hooks/useDebounce";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useEffect, useMemo, useState } from "react";
import type { Restaurant } from "@/types";
import RestaurantCard from "@/components/RestaurantCard";

export default function Home() {
  const f = useAppSelector((s: RootState) => s.filters);
  const d = useAppDispatch();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const qDebounced = useDebounce(f.q, 350);
  const hasQueryRaw = (f.q ?? "").trim().length > 0;
  const hasQuery = (qDebounced ?? "").trim().length > 0;
  const pageSize = 20;
  const [page, setPage] = useState(1);
  const [acc, setAcc] = useState<Restaurant[]>([]);
  const [hasMore, setHasMore] = useState(true);

  const { data: rec, isLoading: recLoading, isError: recError } = useRecommendedRestaurants({ enabled: !!token && !hasQueryRaw });
  const { data: restaurants, isLoading, isError, isFetching } = useRestaurants({ q: qDebounced, page, limit: pageSize, sort: f.sort });
  const { data: menuItems, isLoading: menuLoading, isFetching: menuFetching, isError: menuError } = useMenus({ q: qDebounced, page: 1, limit: 12 });
  const showRecs = !!token && !!rec && !recError && !hasQueryRaw;
  const geo = useGeolocation();
  const [recCount, setRecCount] = useState(16);

  // Reset pagination on query/sort change
  useEffect(() => {
    setPage(1);
    setAcc([]);
    setHasMore(true);
  }, [qDebounced, f.sort]);

  // Accumulate non-recommended pages
  useEffect(() => {
    if (showRecs) return;
    if (!restaurants) return;
    setAcc(prev => {
      const merged = page === 1 ? restaurants : [...prev, ...restaurants];
      const seen = new Set<string>();
      const uniq = merged.filter(r => {
        const id = String(r.id);
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });
      return uniq;
    });
    if (restaurants.length < pageSize) setHasMore(false);
  }, [restaurants, page, showRecs]);

  // Reset recommended visible count when switching modes
  useEffect(() => { if (showRecs) setRecCount(16); }, [showRecs]);

  const list = useMemo(() => (
    showRecs
      ? ((rec ?? []).slice(0, recCount))
      : (acc.length ? acc : (restaurants ?? []))
  ), [showRecs, rec, recCount, acc, restaurants]);

  return (
    <>
      <Navbar/>
      {/* Hero area with image background and overlay */}
      <section
        className="relative text-white"
        
      >
        <img src="/burger-home.png" alt="burger-home" aria-hidden='true' role='presentation' className="absolute inset-0 -z-10 h-[827px] w-full object-cover" fetchPriority='high' decoding='async' />
        <div
          className="absolute h-[827px] inset-0 -z-10 bg-[linear-gradient(180deg,_rgba(0,0,0,0)_-59.98%,_rgba(0,0,0,0.80)_110.09%)]"
        />

        <div className="max-w-6xl mx-auto px-4 py-20">
          <h1 className="text-[40px] leading-[48px] md:text-[60px] md:leading-[72px] font-extrabold tracking-[-0.02em] drop-shadow">
            Explore Culinary Experiences
          </h1>
          <p className="max-w-2xl mt-3 text-white/90">
            Search and refine your choice to discover the perfect restaurant.
          </p>
          <div className="max-w-2xl mt-8">
            <div className="bg-white rounded-full p-1.5 shadow-md flex items-center">
              <Input
                className="rounded-full border-0 focus-visible:ring-[3px] text-zinc-800"
                placeholder="Search restaurants, food and drink"
                value={f.q}
                onChange={(e)=>d(setQuery(e.target.value))}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto mt-120 px-4 py-10">
        {/* Categories row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {[
            { label: 'All Restaurant', image: '/Categoryall.png', to: '/categories' },
            { label: 'Nearby',        image: '/location.png' },
            { label: 'Discount',      image: '/discount.png' },
            { label: 'Best Seller',   image: '/bestseller.png' },
            { label: 'Delivery',      image: '/delivery.png' },
            { label: 'Lunch',         image: '/lunch.png' },
          ].map((c)=> {
            const content = (
              <div className="rounded-xl bg-white border border-neutral-200 shadow-sm p-4 flex items-center gap-3">
                <div className="size-12 grid place-items-center rounded-lg bg-[var(--gray-100)] overflow-hidden">
                  <img src={c.image} alt={c.label} className="w-9 h-9 object-contain" onError={(e)=>{ const img=e.currentTarget; if(!img.src.includes('/fallback1.png')){ img.onerror=null; img.src='/fallback1.png'; }}} />
                </div>
                <div className="text-sm font-medium text-zinc-800">{c.label}</div>
              </div>
            );
            return c.to ? (
              <Link key={c.label} to={c.to} aria-label={c.label}>
                {content}
              </Link>
            ) : (
              <div key={c.label} aria-label={c.label}>{content}</div>
            );
          })}
        </div>

        {(showRecs ? recLoading : isLoading) && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {Array.from({length:8}).map((_,i)=><Skeleton key={i} className="h-56 rounded-xl" />)}
          </div>
        )}
        {(showRecs ? recError : isError) && <div className="mt-6 text-red-600">Failed to load restaurants.</div>}
        <div className="mt-8 flex items-center justify-between">
          <h2 className="text-xl font-semibold">{showRecs ? 'Recommended' : 'Restaurants'}</h2>
          <div className="flex items-center gap-3">
            {showRecs && (
              <Link to="/categories" className="text-sm font-medium text-red-600 hover:underline">
                See All
              </Link>
            )}
            {!showRecs && (
              <select
                value={f.sort ?? 'rating_desc'}
                onChange={(e)=>d(setSort(e.target.value as FiltersState['sort']))}
                className="border rounded-md text-sm px-2 py-1 bg-white"
                aria-label="Sort restaurants"
              >
                <option value="rating_desc">Top Rated</option>
              </select>
            )}
            {!showRecs && (isFetching || (hasQueryRaw && !hasQuery)) && (
              <span className="text-sm text-zinc-500"> Searching…</span>
            )}
          </div>
        </div>
        {list && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {list.map((r) => (
              <RestaurantCard key={r.id} restaurant={r} userPos={geo.position ?? undefined} />
            ))}
          </div>
        )}
        {/* Menu items section appears only when searching */}
        {hasQueryRaw && (
          <>
            <div className="mt-10 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Menu Items</h2>
              {(menuFetching || (hasQueryRaw && !hasQuery)) && (
                <span className="text-sm text-zinc-500"> Searching…</span>
              )}
            </div>
            {menuLoading && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                {Array.from({length:8}).map((_,i)=><Skeleton key={i} className="h-56 rounded-xl" />)}
              </div>
            )}
            {menuError && <div className="mt-6 text-red-600">Failed to load menu items.</div>}
            {menuItems && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                {menuItems.map((m) => (
                  m.restaurantId ? (
                    <Link key={m.id} to={`/restaurant/${m.restaurantId}`}>
                      <Card className="overflow-hidden shadow-sm border border-neutral-200">
                        <CardContent className="p-0">
                          <img src={m.imageUrl || '/fallback1.png'} alt={m.name} className="h-36 w-full object-cover" onError={(e)=>{ const img=e.currentTarget; if(!img.src.includes('/fallback1.png')){img.onerror=null; img.src='/fallback1.png';}}} />
                          <div className="p-4">
                            <div className="font-semibold">{m.name}</div>
                            <div className="mt-1 text-sm text-zinc-600">IDR {new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(m.price)}</div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ) : (
                    <Card key={m.id} className="overflow-hidden shadow-sm border border-neutral-200">
                      <CardContent className="p-0">
                        <img src={m.imageUrl || '/fallback1.png'} alt={m.name} className="h-36 w-full object-cover" onError={(e)=>{ const img=e.currentTarget; if(!img.src.includes('/fallback1.png')){img.onerror=null; img.src='/fallback1.png';}}} />
                        <div className="p-4">
                          <div className="font-semibold">{m.name}</div>
                          <div className="mt-1 text-sm text-zinc-600">IDR {new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(m.price)}</div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                ))}
              </div>
            )}
          </>
        )}

        {!showRecs && !isLoading && (restaurants?.length ?? 0) === 0 && (!hasQueryRaw || (menuItems?.length ?? 0) === 0) && (
          <div className="mt-6 text-zinc-600">
            No results for "{qDebounced}". Try a different keyword.
          </div>
        )}
        {showRecs && rec && list.length < (rec?.length ?? 0) && (
          <div className="text-center mt-8">
            <button
              className="px-4 py-2 rounded-full border border-neutral-300 bg-white shadow-sm"
              onClick={() => setRecCount((n) => n + 16)}
            >
              Show More
            </button>
          </div>
        )}
        {!showRecs && list && list.length > 0 && hasMore && (
          <div className="text-center mt-8">
            <button
              className="px-4 py-2 rounded-full border border-neutral-300 bg-white shadow-sm disabled:opacity-60"
              onClick={() => setPage((p) => p + 1)}
              disabled={isFetching}
            >
              {isFetching ? 'Loading…' : 'Show More'}
            </button>
          </div>
        )}
      </section>

      <Footer />
    </>
  );
}
