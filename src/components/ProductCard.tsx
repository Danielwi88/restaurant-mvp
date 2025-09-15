import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { MenuItem } from "@/types";
import { formatKm } from "@/lib/geo";
import { formatCurrency } from "@/lib/format";
import { useAppDispatch, useAppSelector } from "@/features/store";
import { addToCart, incrementQty, decrementQty } from "@/features/cart/cartSlice";
import { useAddCartItem, type AddCartResponse } from "@/services/queries/orders";
import { showToast } from "@/lib/toast";

export default function ProductCard({ item, distanceKm, localOnly }: { item: MenuItem; distanceKm?: number; localOnly?: boolean }) {
  const d = useAppDispatch();
  const addServer = useAddCartItem();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const qty = useAppSelector((s) => s.cart.items.find((i) => i.id === item.id)?.qty ?? 0);

  const onAdd = () => {
    if (localOnly) {
      d(addToCart({ id:item.id, name:item.name, price:item.price, qty:1, imageUrl:item.imageUrl, restaurantId:item.restaurantId }));
      showToast('Added to cart', 'success');
      return;
    }
    if (token && item.restaurantId) {
      const restaurantIdNum = Number(item.restaurantId);
      const menuIdNum = Number(item.id);
      addServer.mutate({
        restaurantId: Number.isFinite(restaurantIdNum) ? restaurantIdNum : (item.restaurantId as string),
        menuId: Number.isFinite(menuIdNum) ? menuIdNum : (item.id as string),
        quantity: 1,
      },{
        onSuccess: (res: AddCartResponse) => {
          // Also reflect in local cart for immediate UX and badge count
          const serverId = res?.data?.cartItem?.id;
          d(addToCart({ id:item.id, name:item.name, price:item.price, qty:1, imageUrl:item.imageUrl, restaurantId:item.restaurantId, serverCartItemId: serverId ? String(serverId) : undefined }));
          showToast('Item added to cart successfully', 'success');
        },
        onError: () => {
          // Fallback to local cart if server add failed
          d(addToCart({ id:item.id, name:item.name, price:item.price, qty:1, imageUrl:item.imageUrl, restaurantId:item.restaurantId }));
          showToast('Added to cart', 'success');
        }
      });
    } else {
      d(addToCart({ id:item.id, name:item.name, price:item.price, qty:1, imageUrl:item.imageUrl, restaurantId:item.restaurantId }));
      showToast('Added to cart', 'success');
    }
  };
  return (
    <Card className="overflow-hidden">
      <img
        src={item.imageUrl || "/fallback1.png"}
        alt={item.name}
        className="h-36 w-full object-cover"
        onError={(e) => {
          const img = e.currentTarget as HTMLImageElement
          if (!img.src.includes("/fallback1.png")) {
            img.onerror = null
            img.src = "/fallback1.png"
          }
        }}
      />
      <CardContent className="p-4">
        <div className="font-medium">{item.name}</div>
        <div className="text-[var(--color-brand,#D22B21)] font-semibold">{formatCurrency(item.price)}</div>
        {typeof distanceKm === 'number' && (
          <div className="mt-1 text-xs text-zinc-600">{formatKm(distanceKm)}</div>
        )}
        {qty > 0 ? (
          <div className="w-full mt-3 flex items-center justify-center gap-3">
            <button
              className="size-8 rounded-full border border-neutral-300 grid place-items-center text-zinc-700"
              aria-label="Decrease quantity"
              onClick={() => d(decrementQty({ id: item.id }))}
            >
              -
            </button>
            <div className="w-5 text-center text-sm font-medium" aria-live="polite">{qty}</div>
            <button
              className="size-8 rounded-full bg-[var(--color-brand,#D22B21)] text-white grid place-items-center"
              aria-label="Increase quantity"
              onClick={() => d(incrementQty({ id: item.id }))}
            >
              +
            </button>
          </div>
        ) : (
          <Button className="w-full mt-3" onClick={onAdd} disabled={!localOnly && addServer.isPending}>
            {!localOnly && addServer.isPending ? 'Adding…' : 'Add'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
