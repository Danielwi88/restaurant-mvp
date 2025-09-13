import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { MenuItem } from "@/types";
import { formatKm } from "@/lib/geo";
import { formatCurrency } from "@/lib/format";
import { useAppDispatch } from "@/features/store";
import { addToCart } from "@/features/cart/cartSlice";

export default function ProductCard({ item, distanceKm }: { item: MenuItem; distanceKm?: number }) {
  const d = useAppDispatch();
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
        <Button className="w-full mt-3"
          onClick={()=>d(addToCart({ id:item.id, name:item.name, price:item.price, qty:1, imageUrl:item.imageUrl, restaurantId:item.restaurantId }))}>
          Add
        </Button>
      </CardContent>
    </Card>
  );
}
