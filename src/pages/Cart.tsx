import { Link, useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/features/store";
import type { RootState } from "@/features/store";
import { removeFromCart, setServerCartItemId, incrementQty, decrementQty } from "@/features/cart/cartSlice";
import { showToast } from "@/lib/toast";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ChevronRightIcon, MinusIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useRestaurant } from "@/services/queries/restaurants";
import type { CartItem } from "@/types";
import Navbar from "@/components/Navbar";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { apiPost, apiPut } from "@/services/api/axios";

export default function CartPage() {
  const d = useAppDispatch();
  const items = useAppSelector((s: RootState) => s.cart.items);
  const [pendingRemove] = useState<Record<string, boolean>>({});
  const [syncing, setSyncing] = useState(false);
  const nav = useNavigate();

  // Group items by restaurant
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

  const grandTotal = items.reduce((a, b) => a + b.price * b.qty, 0);

  const QtyControl = ({ id, qty, pending }: { id: string; qty: number; pending?: boolean }) => (
    <div className="flex items-center gap-2">
      <button
        className="size-8 rounded-full border border-neutral-300 grid place-items-center text-zinc-700 disabled:opacity-60"
        aria-label="Decrease quantity"
        disabled={pending}
        onClick={() => { d(decrementQty({ id })); }}
      >
        <MinusIcon className="size-4" />
      </button>
      <div className="w-5 text-center text-sm font-medium">{qty}</div>
      <button
        className="size-8 rounded-full bg-[var(--color-brand,#D22B21)] text-white grid place-items-center disabled:opacity-60"
        aria-label="Increase quantity"
        disabled={pending}
        onClick={() => { d(incrementQty({ id })); }}
      >
        <PlusIcon className="size-4" />
      </button>
    </div>
  );

  const syncAndGoCheckout = async (groupItems: CartItem[]) => {
    const tokenNow = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!tokenNow) { nav('/checkout'); return; }
    setSyncing(true);
    try {
      const ops = groupItems.map(async (it) => {
        if (it.serverCartItemId) {
          await apiPut(`cart/${it.serverCartItemId}`, { quantity: it.qty });
        } else if (it.restaurantId) {
          const rnum = Number(it.restaurantId); const mnum = Number(it.id);
          const res = await apiPost<{ data?: { cartItem?: { id?: number | string } } }>('cart', {
            restaurantId: Number.isFinite(rnum) ? rnum : it.restaurantId,
            menuId: Number.isFinite(mnum) ? mnum : it.id,
            quantity: it.qty,
          });
          const sid = res?.data?.cartItem?.id;
          if (sid) d(setServerCartItemId({ id: it.id, serverCartItemId: String(sid) }));
        }
      });
      await Promise.allSettled(ops);
      nav('/checkout');
    } catch (e) {
      if (import.meta.env.DEV) console.error('[cart] sync before checkout failed', e);
      showToast('Failed to sync cart. Please retry.', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const GroupHeader = ({ restaurantId }: { restaurantId: string }) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const canFetch = !!token && restaurantId !== 'other';
    const { data } = useRestaurant(canFetch ? restaurantId : undefined);
    const name = data?.restaurant?.name ?? 'Restaurant';
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-800">
          <img src={data?.restaurant?.logoUrl || '/fallback1.png'} alt={name} className="size-5 rounded-sm object-cover" onError={(e)=>{ const img=e.currentTarget as HTMLImageElement; if(!img.src.includes('/fallback1.png')){ img.onerror=null; img.src='/fallback1.png'; }}} />
          <span>{name}</span>
        </div>
        {restaurantId !== 'other' && (
          <Link to={`/restaurant/${restaurantId}`} className="text-zinc-500" aria-label={`Go to ${name}`}>
            <ChevronRightIcon className="size-5" />
          </Link>
        )}
      </div>
    );
  };

  return (
    <>
      
      <Navbar/>
    <div className="max-w-[800px] mx-auto px-4 py-10">
      <h2 className="text-2xl font-semibold mb-6">My Cart</h2>

      <div className="space-y-5">
        {groups.map((g) => {
          const groupTotal = g.items.reduce((a, b) => a + b.price * b.qty, 0);
          return (
            <Card key={g.restaurantId} className="shadow-sm border border-neutral-200 rounded-2xl">
              <CardContent className="p-4">
                <GroupHeader restaurantId={g.restaurantId} />
                <div className="mt-3 space-y-3">
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
                      <div key={it.id} className="flex items-center gap-3">
                        <img src={it.imageUrl || '/fallback1.png'} alt={it.name} className="h-16 w-16 object-cover rounded-lg" onError={(e)=>{ const img=e.currentTarget as HTMLImageElement; if(!img.src.includes('/fallback1.png')){ img.onerror=null; img.src='/fallback1.png'; }}} />
                        <div className="flex-1">
                          <div className="text-sm text-zinc-700">{it.name}</div>
                          <div className="text-[var(--color-brand,#D22B21)] font-semibold">{formatCurrency(it.price)}</div>
                        </div>
                        <QtyControl id={it.id} qty={it.qty} pending={pendingRemove[it.id]} />
                        <button
                          className="ml-2 size-8 rounded-full border border-neutral-300 grid place-items-center text-zinc-600"
                          aria-label="Remove item"
                          onClick={() => {
                            // Per requirement: trash only removes locally; API deletion is triggered by minus at qty=1
                            d(removeFromCart(it.id));
                          }}
                        >
                          <Trash2Icon className="size-4" />
                        </button>
                      </div>
                    )
                  ))}
                </div>

                <Separator className="my-4" />
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <div className="text-zinc-600">Total</div>
                    <div className="font-bold">{formatCurrency(groupTotal)}</div>
                  </div>
                  <Button className="rounded-full px-6" onClick={() => syncAndGoCheckout(g.items)} disabled={syncing}>
                    {syncing ? 'Updating…' : 'Checkout'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {!items.length && (
          <Card className="shadow-sm border border-neutral-200 rounded-2xl">
            <CardContent className="p-6 text-center text-zinc-500">
              Your cart is empty.
            </CardContent>
          </Card>
        )}
      </div>

      {/* Grand total summary if multiple restaurants */}
      {items.length > 0 && groups.length > 1 && (
        <div className="mt-6 ml-auto max-w-sm">
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between mb-1 text-sm text-zinc-600">
                <span>Subtotal</span><span>{formatCurrency(grandTotal)}</span>
              </div>
              <Separator className="my-3" />
              <div className="flex justify-between font-bold">
                <span>Total</span><span>{formatCurrency(grandTotal)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
    </>
  );
}
