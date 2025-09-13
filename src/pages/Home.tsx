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

export default function Home() {
  const f = useAppSelector((s: RootState) => s.filters);
  const d = useAppDispatch();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const qDebounced = useDebounce(f.q, 350);
  const hasQueryRaw = (f.q ?? "").trim().length > 0;
  const hasQuery = (qDebounced ?? "").trim().length > 0;
  const { data: rec, isLoading: recLoading, isError: recError } = useRecommendedRestaurants({ enabled: !!token && !hasQueryRaw });
  const { data: restaurants, isLoading, isError, isFetching } = useRestaurants({ q: qDebounced, page: 1, limit: 20, sort: f.sort });
  const { data: menuItems, isLoading: menuLoading, isFetching: menuFetching, isError: menuError } = useMenus({ q: qDebounced, page: 1, limit: 12 });
  const showRecs = !!token && !!rec && !recError && !hasQueryRaw;

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
        {/* Categories row (visual only) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {[
            {label:'All Restaurant',icon:'🍔'},
            {label:'Nearby',icon:'📍'},
            {label:'Discount',icon:'%'},
            {label:'Best Seller',icon:'🏆'},
            {label:'Delivery',icon:'🛵'},
            {label:'Lunch',icon:'🍚'},
          ].map((c)=> (
            <div key={c.label} className="rounded-xl bg-white border border-neutral-200 shadow-sm p-4 flex items-center gap-3">
              <div className="size-9 grid place-items-center rounded-lg bg-[var(--gray-100)] text-xl">{c.icon}</div>
              <div className="text-sm font-medium text-zinc-800">{c.label}</div>
            </div>
          ))}
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
        {(showRecs ? rec : restaurants) && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {(showRecs ? rec! : restaurants!).map(r => (
              <Link key={r.id} to={`/restaurant/${r.id}`}>
                <Card className="overflow-hidden shadow-sm border border-neutral-200">
                  <CardContent className="p-0">
                    <div className="h-36 w-full bg-zinc-100 flex items-center justify-center">
                      {r.logoUrl ? (
                        <img src={r.logoUrl} alt={r.name} className="h-20 object-contain" />
                      ) : (
                        <span className="text-zinc-500">{r.name}</span>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="font-semibold">{r.name}</div>
                      <div className="mt-1 text-sm text-zinc-600 flex items-center gap-2">
                        <span>⭐ {r.rating ?? '4.9'}</span>
                        <span className="text-zinc-400">•</span>
                        <span>{r.address ?? 'Jakarta Selatan'} {r.distanceKm ? `· ${r.distanceKm} km` : ''}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
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
                  <Card key={m.id} className="overflow-hidden shadow-sm border border-neutral-200">
                    <CardContent className="p-0">
                      <img src={m.imageUrl || '/fallback1.png'} alt={m.name} className="h-36 w-full object-cover" onError={(e)=>{ const img=e.currentTarget; if(!img.src.includes('/fallback1.png')){img.onerror=null; img.src='/fallback1.png';}}} />
                      <div className="p-4">
                        <div className="font-semibold">{m.name}</div>
                        <div className="mt-1 text-sm text-zinc-600">IDR {new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(m.price)}</div>
                      </div>
                    </CardContent>
                  </Card>
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
        <div className="text-center mt-8">
          <button className="px-4 py-2 rounded-full border border-neutral-300 bg-white shadow-sm">Show More</button>
        </div>
      </section>

      <Footer />
    </>
  );
}
