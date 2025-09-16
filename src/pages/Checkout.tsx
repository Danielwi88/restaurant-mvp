import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/features/store";
import { useCreateOrder } from "@/services/queries/orders";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { RootState } from "@/features/store";
import { updateQty, clearCart } from "@/features/cart/cartSlice";
import { MapPinIcon, MinusIcon, PlusIcon } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiPost, apiPut, apiDelete } from "@/services/api/axios";
import { showToast } from "@/lib/toast";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/Navbar";

export default function Checkout() {
  const d = useAppDispatch();
  const items = useAppSelector((s: RootState) => s.cart.items);
  const total = items.reduce((a, b) => a + b.price * b.qty, 0);
  const deliveryFee = 10_000;
  const serviceFee = 1_000;
  const grandTotal = total + deliveryFee + serviceFee;
  const createOrder = useCreateOrder();
  const nav = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  
  const [pendingRemove] = useState<Record<string, boolean>>({});

  
  const [addr, setAddr] = useState({ name: "", phone: "", address: "", notes: "" });
  const [editing, setEditing] = useState(false);

  // Payment method selection (visual only for now)
  const methods = [
    { id: "bni", label: "Bank Negara Indonesia", logo: "/BNI.svg" },
    { id: "bri", label: "Bank Rakyat Indonesia", logo: "/BRI.svg" },
    { id: "bca", label: "Bank Central Asia", logo: "/BCA.svg" },
    { id: "mandiri", label: "Mandiri", logo: "/Mandiri.svg" },
  ] as const;
  const [method, setMethod] = useState<(typeof methods)[number]["id"]>("bni");
  const [isPlacing, setIsPlacing] = useState(false);

  useEffect(() => {
    if (items.length === 0) {
      nav("/cart", { replace: true });
    }
  }, [items.length, nav]);

  type CheckoutApiBody = { paymentMethod: string; deliveryAddress: string; notes?: string };
  type CheckoutApiResponse = {
    success?: boolean;
    message?: string;
    data?: {
      transaction?: {
        id?: number;
        transactionId?: string;
        paymentMethod?: string;
        status?: string;
        pricing?: { subtotal?: number; serviceFee?: number; deliveryFee?: number; totalPrice?: number };
        restaurants?: Array<{
          restaurant?: { id?: number; name?: string; logo?: string };
          items?: Array<{ menuId?: number; menuName?: string; price?: number; quantity?: number; itemTotal?: number }>;
          subtotal?: number;
        }>;
        createdAt?: string;
      };
    };
  };

  const buy = async () => {
    setIsPlacing(true);
    showToast('Your transaction is being processed');
    try {
      // Sync local cart to server before placing order
      const tokenNow = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (tokenNow) {
        const ops = items.map(async (it) => {
          if (it.serverCartItemId) {
            await apiPut(`cart/${it.serverCartItemId}`, { quantity: it.qty });
          } else if (it.restaurantId) {
            const rnum = Number(it.restaurantId); const mnum = Number(it.id);
            await apiPost('cart', {
              restaurantId: Number.isFinite(rnum) ? rnum : it.restaurantId,
              menuId: Number.isFinite(mnum) ? mnum : it.id,
              quantity: it.qty,
            });
          }
        });
        await Promise.allSettled(ops);
      }
      // Post finalized checkout payload as requested
      const methodLabel = (() => {
        const m = [
          { id: "bni", label: "Bank Negara Indonesia" },
          { id: "bri", label: "Bank Rakyat Indonesia" },
          { id: "bca", label: "Bank Central Asia" },
          { id: "mandiri", label: "Mandiri" },
        ].find(x => x.id === method);
        return m?.label ?? method;
      })();

      const checkoutRes = await apiPost<CheckoutApiResponse>('order/checkout', {
        paymentMethod: methodLabel,
        deliveryAddress: addr.address.trim(),
        notes: addr.notes?.trim() || ''
      } as CheckoutApiBody);

      // Navigate to success first
      nav("/success", {
        replace: true,
        state: {
          summary: {
            date: new Date().toISOString(),
            paymentMethod: methodLabel,
            subtotal: total,
            deliveryFee,
            serviceFee,
            total: total + deliveryFee + serviceFee,
            itemsCount: items.length,
            api: checkoutRes,
          }
        }
      });

      // clear the cart in background (server + local)
      void (async () => {
        try { await apiDelete('cart'); } catch { /* best-effort */ }
        d(clearCart());
      })();
    } catch (err) {
      if (import.meta.env.DEV) console.error("[checkout] create order failed", err);
    } finally {
      setIsPlacing(false);
    }
  };

  
  const addItemHref = (() => {
    const ids = Array.from(new Set(items.map(i => i.restaurantId).filter(Boolean))) as string[];
    if (ids.length === 1) return `/restaurant/${ids[0]}`;
    return "/categories";
  })();

  return (
    <>
    <Navbar/>
    <div className="max-w-[1000px] mx-auto px-4 py-10 grid lg:grid-cols-3 gap-6 gap-x-0">
      {/* Left: Address + Items */}
      <div className="max-w-[590px] lg:col-span-2 space-y-6">
        {/* Delivery Address card */}
        <Card className="rounded-2xl border border-neutral-200 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 text-zinc-800 font-semibold">
                  <MapPinIcon className="size-4 text-[var(--color-brand,#D22B21)]" /> Delivery Address
                </div>
                {!editing ? (
                  <div className="mt-2 text-sm text-zinc-700">
                    <div>{addr.address || "Set your delivery address"}</div>
                    {addr.phone && <div className="mt-1">{addr.phone}</div>}
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4 mt-3">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" value={addr.name} onChange={(e)=>setAddr(a=>({...a, name:e.target.value}))} />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input id="phone" value={addr.phone} onChange={(e)=>setAddr(a=>({...a, phone:e.target.value}))} />
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor="address">Address</Label>
                      <textarea id="address" value={addr.address} onChange={(e)=>setAddr(a=>({...a, address:e.target.value}))}
                        className="w-full border rounded-md p-3 min-h-28 outline-none focus:ring-2 focus:ring-[var(--color-brand,#D22B21)]/30" />
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor="notes">Notes (optional)</Label>
                      <textarea id="notes" value={addr.notes} onChange={(e)=>setAddr(a=>({...a, notes:e.target.value}))}
                        className="w-full border rounded-md p-3 min-h-20 outline-none focus:ring-2 focus:ring-[var(--color-brand,#D22B21)]/30" placeholder="Please ring the doorbell" />
                    </div>
                  </div>
                )}
              </div>
              <div className="ml-4">
                <Button variant={editing?"default":"outline"} className="rounded-full" onClick={()=>setEditing(e=>!e)}>
                  {editing ? "Save" : "Change"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items Card */}
        <Card className="rounded-2xl border border-neutral-200 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="font-semibold">Items</div>
              <Button asChild variant="outline" className="rounded-full h-8 px-3 text-sm">
                <Link to={addItemHref}>Add item</Link>
              </Button>
            </div>
            <div className="mt-3 space-y-3">
              {items.map(i => (
                pendingRemove[i.id] ? (
                  <div key={i.id} className="flex items-center gap-3">
                    <Skeleton className="h-16 w-16 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-8 w-24 rounded-full" />
                  </div>
                ) : (
                  <div key={i.id} className="flex items-center gap-3">
                    <img src={i.imageUrl || '/fallback1.png'} alt={i.name} className="h-16 w-16 rounded-lg object-cover" onError={(e)=>{ const img=e.currentTarget as HTMLImageElement; if(!img.src.includes('/fallback1.png')){ img.onerror=null; img.src='/fallback1.png'; }}} />
                    <div className="flex-1">
                      <div className="text-sm text-zinc-700">{i.name}</div>
                      <div className="text-[var(--color-brand,#D22B21)] font-semibold">{formatCurrency(i.price)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="size-8 rounded-full border border-neutral-300 grid place-items-center text-zinc-700 disabled:opacity-60"
                        aria-label="Decrease"
                        onClick={() => {
                          const next = Math.max(1, i.qty - 1);
                          d(updateQty({ id: i.id, qty: next }));
                        }}
                        disabled={pendingRemove[i.id]}
                      >
                        <MinusIcon className="size-4" />
                      </button>
                      <div className="w-5 text-center text-sm font-medium">{i.qty}</div>
                      <button
                        className="size-8 rounded-full bg-[var(--color-brand,#D22B21)] text-white grid place-items-center disabled:opacity-60"
                        aria-label="Increase"
                        onClick={() => {
                          const next = i.qty + 1;
                          d(updateQty({ id: i.id, qty: next }));
                        }}
                        disabled={pendingRemove[i.id]}
                      >
                        <PlusIcon className="size-4" />
                      </button>
                    </div>
                  </div>
                )
              ))}
              {!items.length && <div className="text-sm text-zinc-500">No items.</div>}
            </div>
          </CardContent>
        </Card>

        {createOrder.error && (
          <p className="text-sm text-red-600">Failed to create order. Please try again.</p>
        )}
      </div>

      {/* Right: Payment + Summary */}
      <aside className="min-w-[390px] lg:col-span-1 space-y-4">
        <Card className="rounded-2xl border border-neutral-200 shadow-sm">
          <CardContent className="p-5">
            <div className="font-semibold mb-3">Payment Method</div>
            <div className="space-y-2">
              {methods.map(m => (
                <label key={m.id} className="flex items-center justify-between py-2 px-3 rounded-md border border-transparent hover:border-neutral-200">
                  <div className="flex items-center gap-3">
                    <img src={m.logo} alt={m.label} className="h-10 w-10 border rounded-lg" onError={(e)=>{const img=e.currentTarget as HTMLImageElement; img.style.visibility='hidden';}} />
                    <span className="text-sm">{m.label}</span>
                  </div>
                  <input type="radio" name="method" checked={method===m.id} onChange={()=>setMethod(m.id)} className="accent-[var(--color-brand,#D22B21)]" />
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-neutral-200 shadow-sm">
          <CardContent className="p-5">
            <div className="font-semibold mb-3">Payment Summary</div>
            <div className="flex justify-between mb-2 text-sm text-zinc-700"><span>Price ({items.length} {items.length===1? 'item':'items'})</span><span>{formatCurrency(total)}</span></div>
            <div className="flex justify-between mb-2 text-sm text-zinc-700"><span>Delivery Fee</span><span>{formatCurrency(deliveryFee)}</span></div>
            <div className="flex justify-between mb-2 text-sm text-zinc-700"><span>Service Fee</span><span>{formatCurrency(serviceFee)}</span></div>
            <Separator className="my-3" />
            <div className="flex justify-between font-bold mb-3">
              <span>Total</span><span>{formatCurrency(grandTotal)}</span>
            </div>
            <Button className="w-full rounded-full" onClick={() => setConfirmOpen(true)} disabled={!items.length || isPlacing}>
              {isPlacing ? 'Processing…' : 'Buy'}
            </Button>
          </CardContent>
        </Card>
        {/* Confirm Payment Dialog */}
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Confirm Payment</DialogTitle>
            </DialogHeader>
            <div className="text-sm text-zinc-700">
              Proceed to pay <span className="font-semibold">{formatCurrency(grandTotal)}</span> for this order?
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
              <Button onClick={() => { setConfirmOpen(false); buy(); }} disabled={isPlacing}>Yes, Pay</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </aside>
    </div>
    {isPlacing && (
      <div className="fixed inset-0 z-[60] bg-white/70 backdrop-blur-[2px] grid place-items-center">
        <Card className="w-full max-w-sm shadow-sm">
          <CardContent className="p-5">
            <div className="text-sm font-medium mb-3">Processing payment…</div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-28" />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Separator />
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-24" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )}
    </>
  );
}
