import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import RestaurantCard from "@/components/RestaurantCard";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { setQuery } from "@/features/filters/filtersSlice";
import type { RootState } from "@/features/store";
import { useAppDispatch, useAppSelector } from "@/features/store";
import { useDebounce } from "@/hooks/useDebounce";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useMenus } from "@/services/queries/menus";
import { useRecommendedRestaurants, useRestaurants } from "@/services/queries/restaurants";
import type { Restaurant } from "@/types";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

export default function Home() {
  const f = useAppSelector((s: RootState) => s.filters);
  const d = useAppDispatch();
  const [token, setToken] = useState<string | null>(() => (typeof window !== 'undefined' ? localStorage.getItem('token') : null));
  const qDebounced = useDebounce(f.q, 350);
  const hasQueryRaw = (f.q ?? "").trim().length > 0;
  const hasQuery = (qDebounced ?? "").trim().length > 0;
  const [pageSize, setPageSize] = useState(12);
  const [page, setPage] = useState(1);
  const [acc, setAcc] = useState<Restaurant[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [forceList, setForceList] = useState(false);

  const recModeDesired = !!token && !hasQueryRaw;
  const recModeActive = recModeDesired && !forceList;
  const { data: rec, isLoading: recLoading, isError: recError } = useRecommendedRestaurants({ enabled: recModeActive });
  const { data: restaurants, isLoading, isError, isFetching } = useRestaurants({ q: qDebounced, page, limit: pageSize, sort: f.sort });
  const { data: menuItems, isLoading: menuLoading, isFetching: menuFetching, isError: menuError } = useMenus({ q: qDebounced, page: 1, limit: 12 });
  const showRecs = recModeActive && !!rec && !recError;
  const geo = useGeolocation();
  const [recCount, setRecCount] = useState(16);

  // React to login/logout without manual refresh
  useEffect(() => {
    const refreshToken = () => {
      try {
        setToken(typeof window !== 'undefined' ? localStorage.getItem('token') : null);
      } catch {
        setToken(null);
      }
    };
    // Custom event fired from auth.ts on login success
    window.addEventListener('auth:changed', refreshToken);
    // Also update when tab gains focus (covers some edge cases)
    window.addEventListener('focus', refreshToken);
    // Cross-tab login via storage event
    window.addEventListener('storage', refreshToken);
    return () => {
      window.removeEventListener('auth:changed', refreshToken);
      window.removeEventListener('focus', refreshToken);
      window.removeEventListener('storage', refreshToken);
    };
  }, []);

  // Reset pagination on query/sort change
  useEffect(() => {
    setPage(1);
    setAcc([]);
    setHasMore(true);
  }, [qDebounced, f.sort]);

  // Accumulate non-recommended pages
  useEffect(() => {
    if (recModeActive) return;
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
  }, [restaurants, page, pageSize, recModeActive]);

  // Reset recommended visible count when switching modes
  useEffect(() => { if (recModeActive) setRecCount(16); }, [recModeActive]);

  const list = useMemo(() => (
    recModeActive
      ? ((rec ?? []).slice(0, recCount))
      : (acc.length ? acc : (restaurants ?? []))
  ), [recModeActive, rec, recCount, acc, restaurants]);

  return (
    <>
      <Navbar/>
      {/* Hero area with image background and overlay */}
      <section
        className="relative text-white -mt-20"
      >
        <img src="/burger-home.png" alt="burger-home" aria-hidden='true' role='presentation' className="absolute inset-0 -z-10 h-[648px] xs:h-[668px] sm:h-[827px] w-full object-cover" fetchPriority='high' decoding='async' />
        <div
          className="absolute inset-0 -z-10 h-[648px] xs:h-[668px] sm:h-[827px] bg-[linear-gradient(180deg,_rgba(0,0,0,0)_-59.98%,_rgba(0,0,0,0.80)_110.09%)]"
        />

        <div className="max-w-[1200px] mx-auto sm:px-0 px-4 py-20">
          <h1 className="text-center text-[40px] leading-[48px] md:text-[60px] md:leading-[72px] font-extrabold tracking-[-0.02em] drop-shadow mt-[146px] sm:mt-[246px]">
            Explore Culinary Experiences
          </h1>
          <p className="max-w-2xl mx-auto mt-3 text-center text-white/90">
            Search and refine your choice to discover the perfect restaurant.
          </p>
          <div className="max-w-[1200px] place-items-center mt-8">
            <div className="bg-white w-full mx-[22px] sm:mx-auto md:w-[604px] flex justify-center rounded-full p-1.5 shadow-md items-center">
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

      <section className="max-w-[1200px] mx-auto px-4 sm:px-0  mt-[130px] xs:mt-[148px] xm:mt-[208px] sm:mt-[288px]">
        {/* Categories row */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {[
            { label: 'All Restaurant', image: '/Categoryall.png', to: '/categories' },
            { label: 'Nearby',        image: '/location.png' },
            { label: 'Discount',      image: '/discount.png' },
            { label: 'Best Seller',   image: '/bestseller.png' },
            { label: 'Delivery',      image: '/delivery.png' },
            { label: 'Lunch',         image: '/lunch.png' },
          ].map((c)=> {
            const content = (
              <div>

              <div className="rounded-2xl bg-white shadow-sm p-4 h-25 flex flex-col object-cover items-center gap-3">
                <div className="size-12 sm:size-[65px] grid place-items-center rounded-lg bg-white overflow-hidden">
                  <img src={c.image} alt={c.label} className="w-full h-full object-contain" onError={(e)=>{ const img=e.currentTarget; if(!img.src.includes('/fallback1.png')){ img.onerror=null; img.src='/fallback1.png'; }}} />
                </div>
              </div>
                <div className="text-center text-sm mt-1 font-bold leading-[28px] text-zinc-800">{c.label}</div>
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

        {(recModeActive ? recLoading : isLoading) && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {Array.from({length:8}).map((_,i)=><Skeleton key={i} className="h-56 rounded-xl" />)}
          </div>
        )}
        {(recModeActive ? recError : isError) && <div className="mt-6 text-red-600">Failed to load restaurants.</div>}
        <div className="mt-6 sm:mt-12 flex items-center justify-between">
          <h2 className="text-xl font-semibold">{recModeActive ? 'Recommended' : 'Restaurants'}</h2>
          <div className="flex items-center gap-3 mt-4 sm:mt-8">
            {recModeActive && (
              <button
                className="text-sm font-medium text-red-600 hover:underline"
                onClick={() => {
                  setForceList(true);
                  setPageSize(12);
                  setPage(1);
                  setAcc([]);
                  setHasMore(true);
                }}
              >
                See All
              </button>
            )}
            
            {!recModeActive && (isFetching || (hasQueryRaw && !hasQuery)) && (
              <span className="text-sm text-zinc-500"> Searching…</span>
            )}
          </div>
        </div>
        {list && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-y-7 gap-4 sm:gap-5 mt-6">
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
        {recModeActive && rec && list.length < (rec?.length ?? 0) && (
          <div className="text-center mt-8">
            <button
              className="px-4 py-2 rounded-full border border-neutral-300 bg-white shadow-sm"
              onClick={() => setRecCount((n) => n + 16)}
            >
              Show More
            </button>
          </div>
        )}
        {!recModeActive && list && list.length > 0 && hasMore && (
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
