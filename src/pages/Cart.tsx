import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { decrementQty, incrementQty } from "@/features/cart/cartSlice";
import type { RootState } from "@/features/store";
import { useAppDispatch, useAppSelector } from "@/features/store";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";
import { useRestaurant } from "@/services/queries/restaurants";
import type { CartItem } from "@/types";
import { ChevronRightIcon, MinusIcon, PlusIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function CartPage() {
  const d = useAppDispatch();
  const items = useAppSelector((s: RootState) => s.cart.items);
  const [pendingRemove] = useState<Record<string, boolean>>({});
  // No syncing state needed since checkout is Redux-only now
  const nav = useNavigate();
  const emptyToastShown = useRef(false);

  // Show a one-time Sonner toast when cart is empty
  useEffect(() => {
    if (items.length === 0 && !emptyToastShown.current) {
      emptyToastShown.current = true;
      toast.info('Your cart is empty. Browse items to continue.');
    }
  }, [items.length]);

 
  const groups = useMemo(() => {
    const m = new Map<string, CartItem[]>();
    for (const it of items) {
      const key = it.restaurantId ?? 'other';
      const arr = m.get(key) ?? [];
      arr.push(it);
      m.set(key, arr);
    }
    return Array.from(m.entries()).map(([restaurantId, items]) => ({ restaurantId, items }));
  }, [items]);

 
  const QtyControl = ({ id, qty, pending }: { id: string; qty: number; pending?: boolean }) => (
    <div className="flex items-center gap-2">
      <button
        className="size-7 xs:size-8 xm:size-9 sm:size-10 rounded-full border border-neutral-300 grid place-items-center text-gray-950 disabled:opacity-60 cursor-pointer"
        aria-label="Decrease quantity"
        disabled={pending}
        onClick={() => { d(decrementQty({ id })); }}
      >
        <MinusIcon className="size-5 sm:size-6" />
      </button>
      <div className="px-0 sm:px-4 text-center text-[16px] sm:text-lg font-semibold">{qty}</div>
      <button
        className="size-7 xs:size-8 xm:size-9 sm:size-10 rounded-full bg-[var(--color-brand,#D22B21)] text-white grid place-items-center disabled:opacity-60 cursor-pointer"
        aria-label="Increase quantity"
        disabled={pending}
        onClick={() => { d(incrementQty({ id })); }}
      >
        <PlusIcon className="size-5 sm:size-6 " />
      </button>
    </div>
  );

  const syncAndGoCheckout = async () => {
    
    nav('/checkout');
  };

  const GroupHeader = ({ restaurantId }: { restaurantId: string }) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const canFetch = !!token && restaurantId !== 'other';
    const { data } = useRestaurant(canFetch ? restaurantId : undefined);
    const name = data?.restaurant?.name ?? 'Restaurant';
    return (
      <div className="flex items-center justify-start ">
        <div className="flex items-center gap-2 text-sm sm:text-lg font-semibold text-gray-950">
          <img src={data?.restaurant?.logoUrl || '/fallback1.png'} alt={name} className="size-5 rounded-sm object-cover" onError={(e)=>{ const img=e.currentTarget as HTMLImageElement; if(!img.src.includes('/fallback1.png')){ img.onerror=null; img.src='/fallback1.png'; }}} />
          <span>{name}</span>
        </div>

        {restaurantId !== 'other' && (
          <Link to={`/restaurant/${restaurantId}`} className="text-zinc-500" aria-label={`Go to ${name}`}>
            <ChevronRightIcon className="size-6 ml-2" />
          </Link>
        )}
      </div>
    );
  };

  return (
    <>
      
      <Navbar/>
    <div className="w-full max-w-[800px] mx-auto px-4 py-12">
      <h2 className="text-[32px] font-extrabold mb-4 sm:mb-8">My Cart</h2>

      <div className="space-y-5">
        {groups.map((g) => {
          const groupTotal = g.items.reduce((a, b) => a + b.price * b.qty, 0);
          return (
            <Card key={g.restaurantId} className="rounded-2xl w-full shadow-[0_0_20px_rgba(203,202,202,0.25)]">
              <CardContent className="p-4 sm:p-0">
                <GroupHeader restaurantId={g.restaurantId} />
                <div className="mt-5 space-y-3 sm:space-y-5">
                  {g.items.map((it) => (
                    pendingRemove[it.id] ? (
                      <div key={it.id} className="flex items-center gap-3">
                        <Skeleton className="h-16 w-16 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-40" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                        <Skeleton className="h-8 w-24 rounded-full" />
                      </div>
                    ) : (
                      <div key={it.id} className="flex items-center gap-x-4 sm:gap-x-[17px] ">
                        <img src={it.imageUrl || '/iconRectangle.png'} alt={it.name} className="size-16 sm:h-20 sm:w-20 object-cover rounded-lg " onError={(e)=>{ const img=e.currentTarget as HTMLImageElement; if(!img.src.includes('/iconRectangle.png')){ img.onerror=null; img.src='/fallback1.png'; }}} />

                        <div className="flex-1">
                          <div className="text-sm sm:text-[16px] sm:leading-[30px] text-gray-950">{it.name}</div>
                          <div className="text-gray-950 font-extrabold text-[16px] sm:text-lg leading-[32px]">{formatCurrency(it.price)}</div>
                        </div>
                        <QtyControl id={it.id} qty={it.qty} pending={pendingRemove[it.id]} />
                        
                      </div>
                    )
                  ))}
                </div>

                <Separator className="my-4" />
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                  <div className="text-sm">
                    <div className="text-gray-950 text-sm sm:text-[16px] sm:leading-[30px]">Total</div>
                    <div className="font-extrabold text-lg sm:text-xl leading-[32px] sm:leading-[34px] mb-3">{formatCurrency(groupTotal)}</div>
                  </div>
                  <Button className="rounded-full px-6 w-full sm:w-[240px] text-sm sm:text-[16px] h-11 sm:h-12 cursor-pointer" onClick={() => syncAndGoCheckout()}>
                    Checkout
                  </Button>
                  
                </div>
              </CardContent>
            </Card>
          );
        })}

        {!items.length && (
          <Card className="shadow-sm border border-neutral-200 rounded-2xl">
            <CardContent className="p-6 text-center text-gray-500">
              Your cart is empty.
            </CardContent>
          </Card>
        )}
      </div>

      
    </div>
    <Footer/>
    </>
  );
}
