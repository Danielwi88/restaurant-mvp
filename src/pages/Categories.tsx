import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import RestaurantCard from '@/components/RestaurantCard';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { setPrice, setRating } from '@/features/filters/filtersSlice';
import type { RootState } from '@/features/store';
import { useAppDispatch, useAppSelector } from '@/features/store';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useInfiniteRestaurants } from '@/services/queries/restaurants';
import type { Restaurant } from '@/types';
import { ListFilter } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

type FilterSectionProps = {
  min: string;
  max: string;
  onChangeMin: (v: string) => void;
  onChangeMax: (v: string) => void;
  rating?: number;
  onChangeRating: (r: number | undefined) => void;
};

function FiltersPanel({ min, max, onChangeMin, onChangeMax, rating, onChangeRating }: FilterSectionProps) {
  return (
    <>
      <div className='text-sm sm:text-[16px] font-extrabold tracking-wider text-gray-950 uppercase'>
        FILTER
      </div>

      <div className='mt-4'>
        <div className='text-16px sm:text-lg font-extrabold text-gray-950 mb-2'>
          Distance
        </div>
        
        <div className='space-y-2 text-sm text-gray-950'>
          {['Nearby', 'Within 1 km', 'Within 3 km', 'Within 5 km'].map((label, i) => (
            <label key={label} className='flex cursor-pointer items-center gap-3 rounded-sm'>
              <input type='radio' name='distance' value={label} className='peer sr-only' defaultChecked={i === 0} />
              <span className='relative inline-flex size-5 shrink-0 items-center justify-center rounded-sm border border-neutral-300 bg-white transition peer-checked:border-transparent peer-checked:bg-[var(--color-brand,#D22B21)] peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-[var(--color-brand,#D22B21)] peer-disabled:border-neutral-200 peer-disabled:bg-neutral-100 before:content-["\"] before:absolute before:w-[10px] before:h-[6px] before:border-b-[3px] before:border-l-[3px] before:border-white before:-rotate-45 before:opacity-0 before:left-1/2 before:top-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:pointer-events-none peer-checked:before:opacity-100'></span>
              <span className='text-gray-950'>{label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className='mt-6 border-t border-gray-300 pt-6'>
        <div className='text-sm font-medium text-gray-950 mb-2'>
          Price
        </div>
        <div className='space-y-3'>
          <div className='relative'>
            <span className='absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500'>
              Rp
            </span>
            <Input
              inputMode='numeric'
              value={min}
              onChange={(e) => onChangeMin(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder='Minimum Price'
              className='pl-9 placeholder:text-gray-400'
            />
          </div>
          <div className='relative'>
            <span className='absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500'>
              Rp
            </span>
            <Input
              inputMode='numeric'
              value={max}
              onChange={(e) => onChangeMax(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder='Maximum Price'
              className='pl-9 placeholder:text-gray-400'
            />
          </div>
        </div>
      </div>

      <div className='mt-6 border-t border-gray-300 pt-6'>
        <div className='text-sm font-medium text-gray-950 mb-2'>
          Rating
        </div>
        <div className='space-y-2 text-sm text-gray-950'>
          {[5, 4, 3, 2, 1].map((r) => (
            <label key={r} className='flex cursor-pointer items-center gap-3 rounded-sm'>
              <input type='radio' name='rating' className='peer sr-only' checked={rating === r} onChange={() => onChangeRating(r)} />
              <span className='relative inline-flex size-5 shrink-0 items-center justify-center rounded-sm border border-neutral-300 bg-white transition peer-checked:border-transparent peer-checked:bg-[var(--color-brand,#D22B21)] peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-[var(--color-brand,#D22B21)] before:content-["\"] before:absolute before:w-[10px] before:h-[6px] before:border-b-[3px] before:border-l-[3px] before:border-white before:-rotate-45 before:opacity-0 before:left-1/2 before:top-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:pointer-events-none peer-checked:before:opacity-100'></span>
              <span className='flex items-center gap-2'>
                <img src='/star.svg' alt='Star' className='h-4 w-4' />
                {r}
              </span>
            </label>
          ))}
          <label className='flex cursor-pointer items-center gap-3 rounded-sm'>
            <input type='radio' name='rating' className='peer sr-only' checked={rating === undefined} onChange={() => onChangeRating(undefined)} />
            <span className='relative inline-flex size-5 shrink-0 items-center justify-center rounded-sm border border-neutral-300 bg-white transition peer-checked:border-transparent peer-checked:bg-[var(--color-brand,#D22B21)] peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-[var(--color-brand,#D22B21)] before:content-["\"] before:absolute before:w-[10px] before:h-[6px] before:border-b-[3px] before:border-l-[3px] before:border-white before:-rotate-45 before:opacity-0 before:left-1/2 before:top-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:pointer-events-none peer-checked:before:opacity-100'></span>
            <span>Any rating</span>
          </label>
        </div>
      </div>
    </>
  );
}

export default function Categories() {
  const f = useAppSelector((s: RootState) => s.filters);
  const d = useAppDispatch();

 
  const [min, setMin] = useState<string>(f.minPrice?.toString() ?? '');
  const [max, setMax] = useState<string>(f.maxPrice?.toString() ?? '');
  const [debouncedMin, setDebouncedMin] = useState<number | undefined>(f.minPrice);
  const [debouncedMax, setDebouncedMax] = useState<number | undefined>(f.maxPrice);

  // Debounce price inputs by 1000ms and ensure min <= max
  useEffect(() => {
    const m = min.trim() ? Number(min) : undefined;
    const M = max.trim() ? Number(max) : undefined;

    const t = setTimeout(() => {
      // Normalize order for dispatching only; do not mutate input values.
      if (m !== undefined && M !== undefined && m > M) {
        setDebouncedMin(M);
        setDebouncedMax(m);
      } else {
        setDebouncedMin(m);
        setDebouncedMax(M);
      }
    }, 1000);
    return () => clearTimeout(t);
  }, [min, max]);

  // Reflect debounced values into Redux filters (no Apply button needed)
  useEffect(() => {
    d(setPrice({ min: debouncedMin, max: debouncedMax }));
  }, [debouncedMin, debouncedMax, d]);

  const { data, isLoading, isError, isFetching, fetchNextPage, hasNextPage } =
    useInfiniteRestaurants({
      q: f.q,
      limit: 8,
      rating: f.rating,
      priceMin: debouncedMin,
      priceMax: debouncedMax,
      sort: 'rating_desc',
    });

  // Flatten pages into a single list
  const list: Restaurant[] = useMemo(() => {
    const pages = data?.pages ?? [];
    const items = pages.flatMap((p) => p.items);
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
    const io = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasNextPage && !isFetching) {
          fetchNextPage();
        }
      },
      { rootMargin: '200px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [fetchNextPage, hasNextPage, isFetching]);

  const geo = useGeolocation();

 
  return (
    <>
      <Navbar />
      <section className='max-w-6xl mx-auto px-4 py-10'>
        <h1 className='text-3xl sm:text[32px] sm:leading-[42px] font-extrabold tracking-[-0.01em]'>
          All Restaurant
        </h1>

        {/* Mobile filter drawer trigger */}
        <div className='mt-4 md:hidden'>
          <Sheet>
            <SheetTrigger asChild>
              <button className='w-full h-12 rounded-2xl bg-white border border-neutral-200 shadow-sm flex items-center justify-between px-4 cursor-pointer'>
                <span className='text-sm sm:text-[16px] font-extrabold tracking-wider text-gray-950 uppercase'>
                  FILTER
                </span>
                <ListFilter className='size-5 text-gray-700' />
              </button>
            </SheetTrigger>
            <SheetContent side='left' className='p-0'>
              <div className='p-4 overflow-y-auto'>
                <FiltersPanel
                  min={min}
                  max={max}
                  onChangeMin={setMin}
                  onChangeMax={setMax}
                  rating={f.rating}
                  onChangeRating={(r) => d(setRating(r))}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className='mt-6 grid grid-cols-12 gap-6'>
          {/* Sidebar Filters (desktop) */}
          <aside className='hidden md:block md:col-span-3'>
            <div className='bg-white rounded-xl border border-neutral-200 shadow-sm p-4 md:sticky md:top-28'>
              <FiltersPanel
                min={min}
                max={max}
                onChangeMin={setMin}
                onChangeMax={setMax}
                rating={f.rating}
                onChangeRating={(r) => d(setRating(r))}
              />
            </div>
          </aside>

          {/* Results grid */}
          <div className='col-span-12 md:col-span-9'>
            {isLoading && list.length === 0 && (
              <div className='grid sm:grid-cols-2  gap-4'>
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className='h-56 rounded-xl' />
                ))}
              </div>
            )}
            {isError && (
              <div className='text-red-600'>Failed to load restaurants.</div>
            )}
            {list && (
              <div className='grid sm:grid-cols-2 gap-4'>
                {list.map((r) => (
                  <RestaurantCard
                    key={String(r.id)}
                    restaurant={r}
                    userPos={geo.position ?? undefined}
                  />
                ))}
              </div>
            )}
            {isFetching && list.length > 0 && (
              <div className='grid sm:grid-cols-2 gap-4 mt-4'>
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className='h-56 rounded-xl' />
                ))}
              </div>
            )}
            {/* Sentinel for auto-fetching next page */}
            <div ref={sentinelRef} className='h-2' />
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
