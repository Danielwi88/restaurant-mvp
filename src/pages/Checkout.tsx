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
import { removeFromCart, updateQty, setServerCartItemId } from "@/features/cart/cartSlice";
import { MapPinIcon, MinusIcon, PlusIcon } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAddCartItem, useRemoveCartItem, type AddCartResponse } from "@/services/queries/orders";
import { showToast } from "@/lib/toast";
import { Skeleton } from "@/components/ui/skeleton";

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
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const removeServer = useRemoveCartItem();
  const addServer = useAddCartItem();
  const [pendingRemove, setPendingRemove] = useState<Record<string, boolean>>({});

  
  const [addr, setAddr] = useState({ name: "", phone: "", address: "" });
  const [editing, setEditing] = useState(false);

  // Payment method selection (visual only for now)
  const methods = [
    { id: "bni", label: "Bank Negara Indonesia", logo: "/bni.png" },
    { id: "bri", label: "Bank Rakyat Indonesia", logo: "/bri.png" },
    { id: "bca", label: "Bank Central Asia", logo: "/bca.png" },
    { id: "mandiri", label: "Mandiri", logo: "/mandiri.png" },
  ] as const;
  const [method, setMethod] = useState<(typeof methods)[number]["id"]>("bni");

  useEffect(() => {
    if (items.length === 0) {
      nav("/cart", { replace: true });
    }
  }, [items.length, nav]);

  const buy = async () => {
    const payload = {
      items: items.map(i => ({ id: i.id, qty: i.qty })),
      customerName: addr.name.trim(),
      phone: addr.phone.trim(),
      address: addr.address.trim(),
      method,
    } as unknown as Parameters<typeof createOrder.mutateAsync>[0];
    try {
      await createOrder.mutateAsync(payload);
      nav("/success", { replace: true });
    } catch (err) {
      if (import.meta.env.DEV) console.error("[checkout] create order failed", err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 grid lg:grid-cols-3 gap-6">
      {/* Left: Address + Items */}
      <div className="lg:col-span-2 space-y-6">
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
                <Link to="/categories">Add item</Link>
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
                        const nextQty = i.qty - 1;
                        if (token && i.serverCartItemId) {
                          if (nextQty > 0) {
                            // Optimistically decrement then delete 1 unit on server
                            d(updateQty({ id: i.id, qty: nextQty }));
                            removeServer.mutate(i.serverCartItemId, {
                              onSuccess: () => {
                                if (i.restaurantId) {
                                  const rnum = Number(i.restaurantId); const mnum = Number(i.id);
                                  addServer.mutate({
                                    restaurantId: Number.isFinite(rnum) ? rnum : i.restaurantId,
                                    menuId: Number.isFinite(mnum) ? mnum : i.id,
                                    quantity: nextQty,
                                  }, {
                                    onSuccess: (res: AddCartResponse) => {
                                      const newId = res?.data?.cartItem?.id;
                                      if (newId) d(setServerCartItemId({ id: i.id, serverCartItemId: String(newId) }));
                                    },
                                    onError: () => {
                                      d(updateQty({ id: i.id, qty: i.qty }));
                                      showToast('Failed to update cart', 'error');
                                    }
                                  });
                                }
                              },
                              onError: () => {
                                // Rollback
                                d(updateQty({ id: i.id, qty: i.qty }));
                                showToast('Failed to update cart', 'error');
                              }
                            });
                          } else {
                            // Hit zero: show skeleton and delete
                            setPendingRemove(prev => ({ ...prev, [i.id]: true }));
                            removeServer.mutate(i.serverCartItemId, {
                              onSuccess: () => {
                                  d(removeFromCart(i.id));
                                  setPendingRemove(prev => { const nx = { ...prev }; delete nx[i.id]; return nx; });
                                },
                                onError: () => {
                                  setPendingRemove(prev => { const nx = { ...prev }; delete nx[i.id]; return nx; });
                                  showToast('Failed to remove item', 'error');
                                }
                              });
                            }
                          } else {
                            if (nextQty > 0) d(updateQty({ id: i.id, qty: nextQty }));
                            else d(removeFromCart(i.id));
                          }
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
                          if (token && i.restaurantId) {
                            const rnum = Number(i.restaurantId); const mnum = Number(i.id);
                            addServer.mutate({
                              restaurantId: Number.isFinite(rnum) ? rnum : i.restaurantId,
                              menuId: Number.isFinite(mnum) ? mnum : i.id,
                              quantity: 1,
                            }, {
                              onSuccess: () => { d(updateQty({ id: i.id, qty: i.qty + 1 })); showToast('Item added to cart successfully', 'success'); },
                              onError: () => { d(updateQty({ id: i.id, qty: i.qty + 1 })); showToast('Added to cart', 'success'); }
                            });
                          } else {
                            d(updateQty({ id: i.id, qty: i.qty + 1 }));
                            showToast('Added to cart', 'success');
                          }
                        }}
                        disabled={pendingRemove[i.id] || addServer.isPending}
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
      <aside className="lg:col-span-1 space-y-4">
        <Card className="rounded-2xl border border-neutral-200 shadow-sm">
          <CardContent className="p-5">
            <div className="font-semibold mb-3">Payment Method</div>
            <div className="space-y-2">
              {methods.map(m => (
                <label key={m.id} className="flex items-center justify-between py-2 px-3 rounded-md border border-transparent hover:border-neutral-200">
                  <div className="flex items-center gap-3">
                    <img src={m.logo} alt={m.label} className="h-5" onError={(e)=>{const img=e.currentTarget as HTMLImageElement; img.style.visibility='hidden';}} />
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
            <Button className="w-full rounded-full" onClick={() => setConfirmOpen(true)} disabled={!items.length || createOrder.isPending}>
              {createOrder.isPending ? 'Processing…' : 'Buy'}
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
              <Button onClick={() => { setConfirmOpen(false); buy(); }} disabled={createOrder.isPending}>Yes, Pay</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </aside>
    </div>
  );
}
