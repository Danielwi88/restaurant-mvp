import Navbar from "@/components/Navbar";
import { useRestaurants, useRecommendedRestaurants } from "@/services/queries/restaurants";
import { useAppDispatch, useAppSelector } from "@/features/store";
import type { RootState } from "@/features/store";
import { setQuery } from "@/features/filters/filtersSlice";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";

export default function Home() {
  const f = useAppSelector((s: RootState) => s.filters);
  const d = useAppDispatch();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const { data: rec, isLoading: recLoading, isError: recError } = useRecommendedRestaurants({ enabled: !!token });
  const { data: restaurants, isLoading, isError } = useRestaurants({ q: f.q, page: 1, limit: 20 });
  const showRecs = !!token && !!rec && !recError;

  return (
    <>
      <Navbar/>
      {/* Hero area with image background and overlay */}
      <section
        className="relative text-white"
        // style={{
        //   backgroundImage:
        //     "linear-gradient(to bottom, rgba(0,0,0,.55), rgba(0,0,0,.55)), url('/burger-home.png')",
        //   backgroundSize: 'cover',
        //   backgroundPosition: 'center',
        // }}
      >
        <img src="/burger-home.png" alt="burger-home" aria-hidden='true' role='presentation' className="absolute inset-0 -z-10 h-[827px] w-full object-cover" fetchPriority='high' decoding='async' />
        <div className="absolute inset-0 -z-10 bg-black/55"/>

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
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {Array.from({length:8}).map((_,i)=><Skeleton key={i} className="h-56 rounded-xl" />)}
          </div>
        )}
        {(showRecs ? recError : isError) && <div className="mt-6 text-red-600">Failed to load restaurants.</div>}
        <div className="mt-8 flex items-center justify-between">
          <h2 className="text-xl font-semibold">{showRecs ? 'Recommended' : 'Restaurants'}</h2>
        </div>
        {(showRecs ? rec : restaurants) && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
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
        <div className="text-center mt-8">
          <button className="px-4 py-2 rounded-full border border-neutral-300 bg-white shadow-sm">Show More</button>
        </div>
      </section>

      <Footer />
    </>
  );
}
