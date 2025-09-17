import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppDispatch } from '@/features/store';
import { openModal } from '@/features/ui/uiSlice';
import { distanceKm, formatKm, getCachedGeo } from '@/lib/geo';
import { useRestaurant } from '@/services/queries/restaurants';
import { Share2Icon, StarIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

const HERO_FALLBACKS = [
  '/fallback3.png',
  '/fallback4.png',
  '/fallback5.png',
  '/fallback6.png',
] as const;

export default function RestaurantDetail() {
  const { id } = useParams();
  const { data, isLoading, isFetching } = useRestaurant(id, {
    limitMenu: 10,
    limitReview: 6,
  });
  const d = useAppDispatch();
  const restaurant = data?.restaurant;
  const menuData = data?.sampleMenus;
  const menu = useMemo(() => menuData ?? [], [menuData]);
  const reviews =
    (
      data as unknown as {
        reviews?: Array<{
          id: string | number;
          star?: number;
          rating?: number;
          comment?: string;
          createdAt?: string;
          user?: {
            id?: string | number;
            name?: string;
            avatar?: string;
            avatarUrl?: string;
          };
        }>;
      }
    )?.reviews ?? [];

  const [activeTab, setActiveTab] = useState<'ALL' | 'FOOD' | 'DRINK'>('ALL');
  const [activeSlide, setActiveSlide] = useState(0);

  const banners = restaurant?.bannerUrls;
  const images = useMemo(() => {
    const imgs = banners?.filter(Boolean) ?? [];
    return imgs.length > 0 ? imgs : ['/burger-home.png'];
  }, [banners]);

  const collage = useMemo(() => {
    return [
      images[0] ?? HERO_FALLBACKS[0],
      images[1] ?? HERO_FALLBACKS[1],
      images[2] ?? HERO_FALLBACKS[2],

      images[3] ?? images[0] ?? HERO_FALLBACKS[3],
    ];
  }, [images]);

  const fallbackFor = (index: number) =>
    HERO_FALLBACKS[index % HERO_FALLBACKS.length] ?? HERO_FALLBACKS[0];

  useEffect(() => {
    if (!images.length) {
      return;
    }
    const timer = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [images.length]);

  useEffect(() => {
    setActiveSlide(0);
  }, [images]);

  const filteredMenu = useMemo(() => {
    if (activeTab === 'ALL') return menu;
    const key = activeTab.toLowerCase();
    return menu.filter((m) => (m.categoryId ?? '').toLowerCase().includes(key));
  }, [menu, activeTab]);

  // Distance text based on cached user location
  const distText = (() => {
    const user = getCachedGeo();
    const km =
      user && restaurant?.coords
        ? distanceKm(user, restaurant.coords)
        : restaurant?.distanceKm;
    return formatKm(km);
  })();

  const LoadingDots = () => (
    <span aria-label='loading' className='inline-flex gap-1 align-middle ml-2'>
      <span className='size-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.3s]' />
      <span className='size-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.15s]' />
      <span className='size-1.5 rounded-full bg-gray-400 animate-bounce' />
    </span>
  );

  const handleShare = () => {
    d(
      openModal({
        id: 'share',
        payload: {
          title: restaurant?.name,
          url:
            typeof window !== 'undefined'
              ? window.location.href
              : undefined,
        },
      })
    );
  };

  return (
    <>
      <Navbar />
      <div className='max-w-6xl mx-auto px-4 py-6'>
        {isLoading && !data ? (
          <>
            {/* Hero skeleton */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <Skeleton className='md:col-span-2 h-64 md:h-80 lg:h-96 w-full rounded-2xl' />
              <div className='grid grid-rows-2 gap-4'>
                <Skeleton className='h-32 md:h-36 lg:h-44 w-full rounded-2xl' />
                <div className='grid grid-cols-2 gap-4'>
                  <Skeleton className='h-32 md:h-36 lg:h-44 w-full rounded-2xl' />
                  <Skeleton className='h-32 md:h-36 lg:h-44 w-full rounded-2xl' />
                </div>
              </div>
            </div>

            {/* Header skeleton */}
            <div className='mt-6 flex items-center justify-between'>
              <div className='flex items-center gap-4'>
                <Skeleton className='size-14 rounded-full' />
                <div className='space-y-2'>
                  <Skeleton className='h-6 w-48' />
                  <Skeleton className='h-4 w-64' />
                </div>
              </div>
              <Skeleton className='h-9 w-24 rounded-full' />
            </div>

            <hr className='my-6' />

            {/* Menu section skeleton */}
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <h2 className='text-xl font-semibold'>Menu</h2>
                <LoadingDots />
              </div>
            </div>
            <div className='mt-4 flex gap-2'>
              <Skeleton className='h-8 w-20 rounded-full' />
              <Skeleton className='h-8 w-16 rounded-full' />
              <Skeleton className='h-8 w-16 rounded-full' />
            </div>
            <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6'>
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className='h-56 rounded-xl' />
              ))}
            </div>

            <div className='text-center mt-8'>
              <Skeleton className='h-9 w-32 rounded-full inline-block' />
              <div className='mt-2 text-sm text-zinc-600'>
                Loading
                <LoadingDots />
              </div>
            </div>

            <hr className='my-8' />

            {/* Reviews skeleton */}
            <div className='flex items-center gap-2'>
              <h2 className='text-xl font-semibold'>Review</h2>
              <LoadingDots />
            </div>
            <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4'>
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className='shadow-sm'>
                  <CardContent className='p-4'>
                    <div className='flex items-center gap-3'>
                      <Skeleton className='size-10 rounded-full' />
                      <div className='space-y-2'>
                        <Skeleton className='h-4 w-40' />
                        <Skeleton className='h-3 w-32' />
                      </div>
                    </div>
                    <Skeleton className='mt-3 h-4 w-24' />
                    <Skeleton className='mt-2 h-12 w-full' />
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Hero section */}
            <div className='md:hidden'>
              <Card className='rounded-3xl border-none shadow-sm'>
                <CardContent className='p-4 space-y-4'>
                  <div className='relative overflow-hidden rounded-3xl bg-neutral-100 aspect-[4/3]'>
                    {images.map((src, index) => (
                      <img
                        key={`hero-mobile-${index}`}
                        src={src}
                        alt={restaurant?.name ?? `slide-${index + 1}`}
                        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
                          index === activeSlide ? 'opacity-100' : 'opacity-0'
                        }`}
                        onError={(e) => {
                          const img = e.currentTarget as HTMLImageElement;
                          const fallback = fallbackFor(index);
                          if (!img.src.endsWith(fallback)) {
                            img.onerror = null;
                            img.src = fallback;
                          }
                        }}
                        aria-hidden={index !== activeSlide}
                      />
                    ))}
                  </div>
                  <div className='flex justify-center gap-2'>
                    {images.map((_, index) => (
                      <button
                        key={`hero-dot-${index}`}
                        type='button'
                        aria-label={`Show image ${index + 1}`}
                        aria-pressed={activeSlide === index}
                        onClick={() => setActiveSlide(index)}
                        className={`h-2.5 w-2.5 rounded-full transition-colors ${
                          activeSlide === index
                            ? 'bg-[var(--color-brand,#D22B21)]'
                            : 'bg-neutral-300'
                        }`}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className='hidden md:grid md:grid-cols-3 gap-4'>
              <img
                src={collage[0]}
                alt={restaurant?.name}
                className='md:col-span-2 h-64 md:h-80 lg:h-96 w-full object-cover rounded-2xl'
                onError={(e) => {
                  const img = e.currentTarget;
                  if (!img.src.endsWith(HERO_FALLBACKS[0])) {
                    img.onerror = null;
                    img.src = HERO_FALLBACKS[0];
                  }
                }}
              />
              <div className='grid grid-rows-2 gap-4'>
                <img
                  src={collage[1]}
                  alt='gallery-1'
                  className='h-32 md:h-36 lg:h-44 w-full object-cover rounded-2xl'
                  onError={(e) => {
                    const img = e.currentTarget;
                    if (!img.src.endsWith(HERO_FALLBACKS[1])) {
                      img.onerror = null;
                      img.src = HERO_FALLBACKS[1];
                    }
                  }}
                />
                <div className='grid grid-cols-2 gap-4'>
                  <img
                    src={collage[2]}
                    alt='gallery-2'
                    className='h-32 md:h-36 lg:h-44 w-full object-cover rounded-2xl'
                    onError={(e) => {
                      const img = e.currentTarget;
                      if (!img.src.endsWith(HERO_FALLBACKS[2])) {
                        img.onerror = null;
                        img.src = HERO_FALLBACKS[2];
                      }
                    }}
                  />
                  <img
                    src={collage[3]}
                    alt='gallery-3'
                    className='h-32 md:h-36 lg:h-44 w-full object-cover rounded-2xl'
                    onError={(e) => {
                      const img = e.currentTarget;
                      if (!img.src.endsWith(HERO_FALLBACKS[3])) {
                        img.onerror = null;
                        img.src = HERO_FALLBACKS[3];
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Resto header */}
            <div className='md:hidden mt-4'>
              <Card className='rounded-3xl border-none shadow-sm'>
                <CardContent className='p-4'>
                  <div className='flex items-start justify-between gap-4'>
                    <div className='flex items-center gap-3'>
                      <Avatar className='size-16'>
                        <AvatarImage src={restaurant?.logoUrl} alt={restaurant?.name} />
                        {/* <AvatarFallback className='bg-neutral-100 text-gray-600 font-semibold'>
                          {(restaurant?.name ?? '?').slice(0, 2).toUpperCase()}
                        </AvatarFallback> */}
                      </Avatar>
                      <div>
                        <div className='text-lg font-semibold text-gray-950'>
                          {restaurant?.name}
                        </div>
                        <div className='mt-2 flex items-center gap-2 text-sm text-zinc-600'>
                          <img src='/star.svg' alt='rating' className='h-4 w-4' />
                          <span className='text-[15px] font-semibold text-gray-950'>
                            {restaurant?.rating ?? 4.9}
                          </span>
                        </div>
                        <div className='mt-1 text-xs text-zinc-500 max-w-[220px]'>
                          {restaurant?.address ?? 'Jakarta Selatan'}
                          {distText ? ` · ${distText}` : ''}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant='outline'
                      size='icon'
                      className='shrink-0 rounded-full'
                      onClick={handleShare}
                      aria-label='Share restaurant'
                    >
                      <Share2Icon className='size-5' />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className='mt-6 hidden md:flex items-center justify-between'>
              <div className='flex items-center gap-4'>
                <Avatar className='size-[90px] sm:size-30'>
                  <AvatarImage
                    src={restaurant?.logoUrl}
                    alt={restaurant?.name}
                  />
                  {/* <AvatarFallback className="text-gray-950">{(restaurant?.name ?? "?").slice(0,2)}</AvatarFallback> */}
                </Avatar>
                <div>
                  <div className='text-2xl font-semibold'>
                    {restaurant?.name}
                  </div>
                  <div className='mt-1 flex items-center justify-start gap-2 text-sm text-zinc-600'>

                    <img src="/star.svg" alt="star" width='24' height='24' />
                    <span className='text-[16px] sm:text-lg font-semibold'>{restaurant?.rating ?? 4.9}</span>
                    
                  </div>
                    <span className='text-[16px] sm:text-lg font-medium'>
                      {restaurant?.address ?? 'Jakarta Selatan'}
                      {distText ? ` · ${distText}` : ''}
                    </span>
                </div>
              </div>
              <div className='flex items-center'>
                {isFetching && <LoadingDots />}
                <Button
                  variant='outline'
                  className='rounded-full ml-3 text-[16px] font-bold w-[140px] h-[44px]'
                  onClick={handleShare}
                >
                  <Share2Icon /> Share
                </Button>
              </div>
            </div>

            <hr className='my-6' />

            {/* Menu Section */}
            <div className='flex items-center justify-between'>
              <h2 className='text-xl font-semibold'>Menu</h2>
            </div>
            <div className='mt-4 flex gap-2'>
              {(['ALL', 'FOOD', 'DRINK'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`px-3 py-1.5 rounded-full border text-sm ${
                    activeTab === t
                      ? 'bg-[#ffecec] text-brand border-brand'
                      : 'bg-white text-gray-950 border-neutral-300'
                  }`}
                >
                  {t === 'ALL'
                    ? 'All Menu'
                    : t.charAt(0) + t.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mt-6'>
              {filteredMenu.map((m) => (
                <ProductCard key={m.id} item={m} localOnly />
              ))}
            </div>

            <div className='text-center mt-8'>
              <Button variant='outline' className='rounded-full'>
                Show More
              </Button>
              {isFetching && (
                <div className='mt-2 text-sm text-zinc-600'>
                  Updating
                  <LoadingDots />
                </div>
              )}
            </div>

            <hr className='my-8' />

            {/* Review Section */}
            <div className='flex items-center gap-2'>
              <h2 className='text-xl font-semibold'>Review</h2>
              <div className='flex items-center gap-1 text-sm text-gray-950'>
                <StarIcon className='size-4 text-yellow-500' />
                <span>{restaurant?.rating ?? 4.9}</span>
              </div>
            </div>
            <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4'>
              {reviews.map((rv) => (
                <Card key={String(rv.id)} className='shadow-sm'>
                  <CardContent className='p-4'>
                    <div className='flex items-center gap-3'>
                      <Avatar className='size-10'>
                        {/* No avatar url provided by API, show initials */}
                        <AvatarFallback className='text-gray-950'>
                          {(rv.user?.name ?? '?')
                            .split(' ')
                            .map((s) => s[0])
                            .join('')
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className='font-medium'>
                          {rv.user?.name ?? 'Anonymous'}
                        </div>
                        <div className='text-xs text-zinc-500'>
                          {rv.createdAt
                            ? new Date(rv.createdAt).toLocaleString('en-GB', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : ''}
                        </div>
                      </div>
                    </div>
                    <div className='mt-2 flex gap-1 text-yellow-500'>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <StarIcon
                          key={i}
                          className={`size-4 ${
                            i < Math.round(rv.star ?? rv.rating ?? 0)
                              ? 'fill-yellow-500'
                              : ''
                          }`}
                        />
                      ))}
                    </div>
                    <p className='mt-2 text-sm text-gray-950'>{rv.comment}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className='text-center mt-6'>
              <Button variant='outline' className='rounded-full'>
                Show More
              </Button>
              {isFetching && (
                <div className='mt-2 text-sm text-zinc-600'>
                  Updating
                  <LoadingDots />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
