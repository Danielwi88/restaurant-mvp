import { Link } from "react-router-dom";
import { useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/features/store";
import type { RootState } from "@/features/store";
import { updateQty, removeFromCart, setServerCartItemId } from "@/features/cart/cartSlice";
import { useAddCartItem, useRemoveCartItem, type AddCartResponse } from "@/services/queries/orders";
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

export default function CartPage() {
  const d = useAppDispatch();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const removeServer = useRemoveCartItem();
  const addServer = useAddCartItem();
  const items = useAppSelector((s: RootState) => s.cart.items);
  const [pendingRemove, setPendingRemove] = useState<Record<string, boolean>>({});

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

  const QtyControl = ({ id, qty, serverCartItemId, restaurantId, pending }: { id: string; qty: number; serverCartItemId?: string; restaurantId?: string; pending?: boolean }) => (
    <div className="flex items-center gap-2">
      <button
        className="size-8 rounded-full border border-neutral-300 grid place-items-center text-zinc-700 disabled:opacity-60"
        aria-label="Decrease quantity"
        disabled={pending}
        onClick={() => {
          const nextQty = qty - 1;
          if (token && serverCartItemId) {
            if (nextQty > 0) {
              // Optimistically decrement, then delete 1 unit on server
              d(updateQty({ id, qty: nextQty }));
              removeServer.mutate(serverCartItemId, {
                onSuccess: () => {
                  // Recreate remaining quantity on server to keep it in sync
                  if (restaurantId) {
                    const rnum = Number(restaurantId); const mnum = Number(id);
                    addServer.mutate({
                      restaurantId: Number.isFinite(rnum) ? rnum : restaurantId,
                      menuId: Number.isFinite(mnum) ? mnum : id,
                      quantity: nextQty,
                    }, {
                      onSuccess: (res: AddCartResponse) => {
                        const newId = res?.data?.cartItem?.id;
                        if (newId) d(setServerCartItemId({ id, serverCartItemId: String(newId) }));
                      },
                      onError: () => {
                        // Rollback local qty if server couldn't be recreated
                        d(updateQty({ id, qty }));
                        showToast('Failed to update cart', 'error');
                      }
                    });
                  }
                },
                onError: () => {
                  // Rollback on failure
                  d(updateQty({ id, qty }));
                  showToast('Failed to update cart', 'error');
                }
              });
            } else {
              // Quantity would hit 0: show pending skeleton and delete on server
              setPendingRemove(prev => ({ ...prev, [id]: true }));
              removeServer.mutate(serverCartItemId, {
                onSuccess: () => {
                  d(removeFromCart(id));
                  setPendingRemove(prev => { const nx = { ...prev }; delete nx[id]; return nx; });
                },
                onError: () => {
                  setPendingRemove(prev => { const nx = { ...prev }; delete nx[id]; return nx; });
                  showToast('Failed to remove item', 'error');
                }
              });
            }
          } else {
            // Not linked to server: local fallback
            if (nextQty > 0) d(updateQty({ id, qty: nextQty }));
            else d(removeFromCart(id));
          }
        }}
      >
        <MinusIcon className="size-4" />
      </button>
      <div className="w-5 text-center text-sm font-medium">{qty}</div>
      <button
        className="size-8 rounded-full bg-[var(--color-brand,#D22B21)] text-white grid place-items-center disabled:opacity-60"
        aria-label="Increase quantity"
        disabled={pending || addServer.isPending}
        onClick={() => {
          if (token && restaurantId) {
            const rnum = Number(restaurantId); const mnum = Number(id);
            addServer.mutate({
              restaurantId: Number.isFinite(rnum) ? rnum : restaurantId,
              menuId: Number.isFinite(mnum) ? mnum : id,
              quantity: 1,
            }, {
              onSuccess: () => { d(updateQty({ id, qty: qty + 1 })); showToast('Item added to cart successfully', 'success'); },
              onError: () => { d(updateQty({ id, qty: qty + 1 })); showToast('Added to cart', 'success'); }
            });
          } else {
            d(updateQty({ id, qty: qty + 1 }));
            showToast('Added to cart', 'success');
          }
        }}
      >
        <PlusIcon className="size-4" />
      </button>
    </div>
  );

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
    <div className="max-w-6xl mx-auto px-4 py-10">
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
                        <QtyControl id={it.id} qty={it.qty} serverCartItemId={it.serverCartItemId} restaurantId={it.restaurantId} pending={pendingRemove[it.id]} />
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
                  <Button asChild className="rounded-full px-6">
                    <Link to="/checkout">Checkout</Link>
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
