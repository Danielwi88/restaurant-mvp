// src/pages/RestaurantDetail.tsx
import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useRestaurant } from "@/services/queries/restaurants";
import ProductCard from "@/components/ProductCard";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MapPinIcon, Share2Icon, StarIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { openModal } from "@/features/ui/uiSlice";
import { useAppDispatch } from "@/features/store";
import { distanceKm, formatKm, getCachedGeo } from "@/lib/geo";

const HERO_FALLBACKS = [
  "/fallback3.png",
  "/fallback4.png",
  "/fallback5.png",
  "/fallback6.png",
] as const;

export default function RestaurantDetail() {
  const { id } = useParams();
  const { data, isLoading, isFetching } = useRestaurant(id, { limitMenu: 10, limitReview: 6 });
  const d = useAppDispatch();
  const r = data?.restaurant;
  const menuData = data?.sampleMenus;
  const menu = useMemo(() => menuData ?? [], [menuData]);
  const reviews = (data as unknown as { reviews?: Array<{ id: string | number; star?: number; rating?: number; comment?: string; createdAt?: string; user?: { id?: string | number; name?: string; avatar?: string; avatarUrl?: string } }> })?.reviews ?? [];

  const [activeTab, setActiveTab] = useState<"ALL" | "FOOD" | "DRINK">("ALL");

  const banners = r?.bannerUrls;
  const images = useMemo(() => {
    const imgs = banners?.filter(Boolean) ?? [];
    return imgs.length > 0 ? imgs : ["/burger-home.png"];
  }, [banners]);

  const collage = useMemo(() => {
    return [
      images[0] ?? HERO_FALLBACKS[0],
      images[1] ?? HERO_FALLBACKS[1],
      images[2] ?? HERO_FALLBACKS[2],
      // For the 4th image: prefer images[3], then fallback to images[0],
      // and finally to fallback6.png via onError handler below.
      (images[3] ?? images[0]) ?? HERO_FALLBACKS[3],
    ];
  }, [images]);

  const filteredMenu = useMemo(() => {
    if (activeTab === "ALL") return menu;
    const key = activeTab.toLowerCase();
    return menu.filter((m) => (m.categoryId ?? "").toLowerCase().includes(key));
  }, [menu, activeTab]);

  // Distance text based on cached user location
  const distText = (() => {
    const user = getCachedGeo();
    const km = user && r?.coords ? distanceKm(user, r.coords) : r?.distanceKm;
    return formatKm(km);
  })();

  const LoadingDots = () => (
    <span aria-label="loading" className="inline-flex gap-1 align-middle ml-2">
      <span className="size-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:-0.3s]" />
      <span className="size-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:-0.15s]" />
      <span className="size-1.5 rounded-full bg-zinc-400 animate-bounce" />
    </span>
  );

  return (
    <>
      <Navbar/>
      <div className="max-w-6xl mx-auto px-4 py-6">
        {isLoading && !data ? (
          <>
            {/* Hero skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Skeleton className="md:col-span-2 h-64 md:h-80 lg:h-96 w-full rounded-2xl" />
              <div className="grid grid-rows-2 gap-4">
                <Skeleton className="h-32 md:h-36 lg:h-44 w-full rounded-2xl" />
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-32 md:h-36 lg:h-44 w-full rounded-2xl" />
                  <Skeleton className="h-32 md:h-36 lg:h-44 w-full rounded-2xl" />
                </div>
              </div>
            </div>

            {/* Header skeleton */}
            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Skeleton className="size-14 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-64" />
                </div>
              </div>
              <Skeleton className="h-9 w-24 rounded-full" />
            </div>

            <hr className="my-6" />

            {/* Menu section skeleton */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold">Menu</h2>
                <LoadingDots />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Skeleton className="h-8 w-20 rounded-full" />
              <Skeleton className="h-8 w-16 rounded-full" />
              <Skeleton className="h-8 w-16 rounded-full" />
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              {Array.from({ length:8 }).map((_,i)=> (
                <Skeleton key={i} className="h-56 rounded-xl" />
              ))}
            </div>

            <div className="text-center mt-8">
              <Skeleton className="h-9 w-32 rounded-full inline-block" />
              <div className="mt-2 text-sm text-zinc-600">Loading<LoadingDots /></div>
            </div>

            <hr className="my-8" />

            {/* Reviews skeleton */}
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">Review</h2>
              <LoadingDots />
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {Array.from({ length:6 }).map((_,i)=> (
                <Card key={i} className="shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="size-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                    <Skeleton className="mt-3 h-4 w-24" />
                    <Skeleton className="mt-2 h-12 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <>
        {/* Hero images collage */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <img
            src={collage[0]}
            alt={r?.name}
            className="md:col-span-2 h-64 md:h-80 lg:h-96 w-full object-cover rounded-2xl"
            onError={(e)=>{ const img=e.currentTarget; if (!img.src.endsWith(HERO_FALLBACKS[0])) { img.onerror=null; img.src=HERO_FALLBACKS[0]; }}}
          />
          <div className="grid grid-rows-2 gap-4">
            <img
              src={collage[1]}
              alt="gallery-1"
              className="h-32 md:h-36 lg:h-44 w-full object-cover rounded-2xl"
              onError={(e)=>{ const img=e.currentTarget; if (!img.src.endsWith(HERO_FALLBACKS[1])) { img.onerror=null; img.src=HERO_FALLBACKS[1]; }}}
            />
            <div className="grid grid-cols-2 gap-4">
              <img
                src={collage[2]}
                alt="gallery-2"
                className="h-32 md:h-36 lg:h-44 w-full object-cover rounded-2xl"
                onError={(e)=>{ const img=e.currentTarget; if (!img.src.endsWith(HERO_FALLBACKS[2])) { img.onerror=null; img.src=HERO_FALLBACKS[2]; }}}
              />
              <img
                src={collage[3]}
                alt="gallery-3"
                className="h-32 md:h-36 lg:h-44 w-full object-cover rounded-2xl"
                onError={(e)=>{ const img=e.currentTarget; if (!img.src.endsWith(HERO_FALLBACKS[3])) { img.onerror=null; img.src=HERO_FALLBACKS[3]; }}}
              />
            </div>
          </div>
        </div>

        {/* Resto header */}
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="size-14">
              <AvatarImage src={r?.logoUrl} alt={r?.name} />
              <AvatarFallback className="text-zinc-700">{(r?.name ?? "?").slice(0,2)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="text-2xl font-semibold">{r?.name}</div>
              <div className="mt-1 flex items-center gap-2 text-sm text-zinc-600">
                <StarIcon className="size-4 text-yellow-500" />
                <span>{r?.rating ?? 4.9}</span>
                <span className="text-zinc-400">•</span>
                <MapPinIcon className="size-4" />
                <span>{r?.address ?? "Jakarta Selatan"}{distText ? ` · ${distText}` : ""}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center">
            {isFetching && <LoadingDots />}
            <Button
              variant="outline"
              className="rounded-full ml-3"
              onClick={() => d(openModal({ id: "share", payload: { title: r?.name, url: typeof window !== 'undefined' ? window.location.href : undefined } }))}
            >
              <Share2Icon /> Share
            </Button>
          </div>
        </div>

        <hr className="my-6" />

        {/* Menu Section */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Menu</h2>
        </div>
        <div className="mt-4 flex gap-2">
          {(["ALL","FOOD","DRINK"] as const).map((t)=> (
            <button key={t}
              onClick={()=>setActiveTab(t)}
              className={`px-3 py-1.5 rounded-full border text-sm ${activeTab===t?"bg-[var(--color-brand,#D22B21)] text-white border-transparent":"bg-white text-zinc-700 border-neutral-300"}`}
            >
              {t === "ALL" ? "All Menu" : t.charAt(0) + t.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {filteredMenu.map((m) => (
            <ProductCard key={m.id} item={m} />
          ))}
        </div>

        <div className="text-center mt-8">
          <Button variant="outline" className="rounded-full">Show More</Button>
          {isFetching && <div className="mt-2 text-sm text-zinc-600">Updating<LoadingDots /></div>}
        </div>

        <hr className="my-8" />

        {/* Review Section */}
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Review</h2>
          <div className="flex items-center gap-1 text-sm text-zinc-700">
            <StarIcon className="size-4 text-yellow-500" />
            <span>{r?.rating ?? 4.9}</span>
          </div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {reviews.map((rv) => (
            <Card key={String(rv.id)} className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="size-10">
                    {/* No avatar url provided by API, show initials */}
                    <AvatarFallback className="text-zinc-700">
                      {(rv.user?.name ?? "?").split(" ").map((s)=>s[0]).join("").slice(0,2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{rv.user?.name ?? "Anonymous"}</div>
                    <div className="text-xs text-zinc-500">
                      {rv.createdAt ? new Date(rv.createdAt).toLocaleString("en-GB", { day:"2-digit", month:"long", year:"numeric", hour:"2-digit", minute:"2-digit" }) : ""}
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex gap-1 text-yellow-500">
                  {Array.from({length:5}).map((_,i)=> (
                    <StarIcon key={i} className={`size-4 ${i < Math.round(rv.star ?? rv.rating ?? 0) ? "fill-yellow-500" : ""}`} />
                  ))}
                </div>
                <p className="mt-2 text-sm text-zinc-700">
                  {rv.comment}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="text-center mt-6">
          <Button variant="outline" className="rounded-full">Show More</Button>
          {isFetching && <div className="mt-2 text-sm text-zinc-600">Updating<LoadingDots /></div>}
        </div>
          </>
        )}
      </div>
    </>
  );
}
