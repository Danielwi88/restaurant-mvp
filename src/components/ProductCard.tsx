import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { MenuItem } from "@/types";
import { formatCurrency } from "@/lib/format";
import { useAppDispatch } from "@/features/store";
import { addToCart } from "@/features/cart/cartSlice";

export default function ProductCard({ item }: { item: MenuItem }) {
  const d = useAppDispatch();
  return (
    <Card className="overflow-hidden">
      <img src={item.imageUrl} alt={item.name} className="h-36 w-full object-cover" />
      <CardContent className="p-4">
        <div className="font-medium">{item.name}</div>
        <div className="text-[var(--color-brand,#D22B21)] font-semibold">{formatCurrency(item.price)}</div>
        <Button className="w-full mt-3"
          onClick={()=>d(addToCart({ id:item.id, name:item.name, price:item.price, qty:1, imageUrl:item.imageUrl, restaurantId:item.restaurantId }))}>
          Add
        </Button>
      </CardContent>
    </Card>
  );
}
