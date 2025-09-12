import { Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/features/store";
import type { RootState } from "@/features/store";
import { updateQty, removeFromCart } from "@/features/cart/cartSlice";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function CartPage() {
  const d = useAppDispatch();
  const items = useAppSelector((s: RootState) => s.cart.items);
  const total = items.reduce((a, b) => a + b.price * b.qty, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-semibold mb-4">My Cart</h2>

      <div className="space-y-4">
        {items.map(it => (
          <Card key={it.id}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <img src={it.imageUrl} alt={it.name} className="h-16 w-16 object-cover rounded-lg" />
                <div className="flex-1">
                  <div className="font-medium">{it.name}</div>
                  <div className="text-[var(--color-brand,#D22B21)] font-semibold">
                    {formatCurrency(it.price)}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => d(updateQty({ id: it.id, qty: it.qty - 1 }))}>-</Button>
                  <div className="w-8 text-center">{it.qty}</div>
                  <Button variant="outline" onClick={() => d(updateQty({ id: it.id, qty: it.qty + 1 }))}>+</Button>
                  <Button variant="outline" onClick={() => d(removeFromCart(it.id))}>Remove</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {!items.length && (
          <Card>
            <CardContent className="p-6 text-center text-zinc-500">
              Your cart is empty.
            </CardContent>
          </Card>
        )}
      </div>

      <div className="mt-6 ml-auto max-w-sm">
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between mb-1 text-sm text-zinc-600">
              <span>Subtotal</span><span>{formatCurrency(total)}</span>
            </div>
            <Separator className="my-3" />
            <div className="flex justify-between font-bold">
              <span>Total</span><span>{formatCurrency(total)}</span>
            </div>
            <Button asChild className="w-full mt-4" disabled={!items.length}>
              <Link to="/checkout">Checkout</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
