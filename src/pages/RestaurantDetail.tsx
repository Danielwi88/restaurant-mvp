// src/pages/RestaurantDetail.tsx
import { useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useRestaurant } from "@/services/queries/restaurants";
import ProductCard from "@/components/ProductCard";
import { Card, CardContent } from "@/components/ui/card";

export default function RestaurantDetail() {
  const { id } = useParams();
  const { data } = useRestaurant(id);
  const r = data?.restaurant;
  const menu = data?.sampleMenus;

  return (
    <>
      <Navbar/>
      <div className="max-w-6xl mx-auto px-4 py-6">
        <Card className="mb-6"><CardContent className="p-4">
          <div className="text-xl font-semibold">{r?.name}</div>
          <div className="text-sm text-zinc-500">{r?.address}</div>
        </CardContent></Card>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {menu?.map(m => <ProductCard key={m.id} item={m}/>)}
        </div>
      </div>
    </>
  );
}
