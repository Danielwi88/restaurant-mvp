import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "@/features/store";
import { useCreateOrder } from "@/services/queries/orders";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { RootState } from "@/features/store";

export default function Checkout() {
  const items = useAppSelector((s: RootState) => s.cart.items);
  const total = items.reduce((a, b) => a + b.price * b.qty, 0);
  const deliveryFee = 10_000;
  const serviceFee = 1_000;
  const grandTotal = total + deliveryFee + serviceFee;
  const createOrder = useCreateOrder();
  const nav = useNavigate();

  useEffect(() => {
    if (items.length === 0) {
      nav("/cart", { replace: true });
    }
  }, [items.length, nav]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const payload = {
      items: items.map(i => ({ id: i.id, qty: i.qty })),
      customerName: String(f.get("name") || "").trim(),
      phone: String(f.get("phone") || "").trim(),
      address: String(f.get("address") || "").trim(),
    };
    try {
      await createOrder.mutateAsync(payload);
      nav("/success", { replace: true });
    } catch {
      // error state is shown below via createOrder.error
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 grid lg:grid-cols-3 gap-6">
      {/* Left: Address + Items */}
      <form onSubmit={onSubmit} className="lg:col-span-2 space-y-6">
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="font-semibold">Delivery Address</div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" name="name" required />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" name="phone" required />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="address">Address</Label>
                <textarea id="address" name="address" required
                  className="w-full border rounded-md p-3 min-h-28 outline-none focus:ring-2 focus:ring-[var(--color-brand,#D22B21)]/30" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="font-semibold mb-3">Items</div>
            <div className="space-y-3">
              {items.map(i => (
                <div key={i.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={i.imageUrl} alt={i.name} className="h-12 w-12 rounded-lg object-cover" />
                    <span>{i.name} × {i.qty}</span>
                  </div>
                  <span className="font-medium">{formatCurrency(i.price * i.qty)}</span>
                </div>
              ))}
              {!items.length && <div className="text-sm text-zinc-500">No items.</div>}
            </div>
          </CardContent>
        </Card>

        <Button className="w-full sm:w-auto" disabled={!items.length || createOrder.isPending}>
          {createOrder.isPending ? "Processing..." : "Buy"}
        </Button>
        {createOrder.error && (
          <p className="text-sm text-red-600">Failed to create order. Please try again.</p>
        )}
      </form>

      {/* Right: Summary */}
      <aside className="lg:col-span-1">
        <Card>
          <CardContent className="p-6">
            <div className="font-semibold mb-3">Payment Summary</div>
            <div className="flex justify-between mb-2"><span>Items</span><span>{formatCurrency(total)}</span></div>
            <div className="flex justify-between mb-2"><span>Delivery Fee</span><span>{formatCurrency(deliveryFee)}</span></div>
            <div className="flex justify-between mb-2"><span>Service Fee</span><span>{formatCurrency(serviceFee)}</span></div>
            <Separator className="my-3" />
            <div className="flex justify-between font-bold">
              <span>Total</span><span>{formatCurrency(grandTotal)}</span>
            </div>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
