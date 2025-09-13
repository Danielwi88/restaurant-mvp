import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import type { Restaurant } from "@/types";
import type { LatLong } from "@/lib/geo";
import { distanceKm, formatKm } from "@/lib/geo";
import { useRestaurant } from "@/services/queries/restaurants";

export default function RestaurantCard({ restaurant, userPos }: { restaurant: Restaurant; userPos?: LatLong }) {
  // Hydrate missing coordinates from detail API when not present in list
  const needsCoords = !restaurant.coords;
  const { data } = useRestaurant(needsCoords ? restaurant.id : undefined);
  const hydrated = data?.restaurant;
  const coords = restaurant.coords ?? hydrated?.coords;
  const km = userPos && coords ? distanceKm(userPos, coords) : restaurant.distanceKm ?? hydrated?.distanceKm;
  const distText = formatKm(km);

  return (
    <Link to={`/restaurant/${restaurant.id}`}>
      <Card className="overflow-hidden shadow-sm border border-neutral-200">
        <CardContent className="p-0">
          <div className="h-36 w-full bg-zinc-100 flex items-center justify-center">
            {restaurant.logoUrl ? (
              <img src={restaurant.logoUrl} alt={restaurant.name} className="h-20 object-contain" />
            ) : (
              <span className="text-zinc-500">{restaurant.name}</span>
            )}
          </div>
          <div className="p-4">
            <div className="font-semibold">{restaurant.name}</div>
            <div className="mt-1 text-sm text-zinc-600 flex items-center gap-2">
              <span>⭐ {restaurant.rating ?? '4.9'}</span>
              <span className="text-zinc-400">•</span>
              <span>{restaurant.address ?? 'Jakarta Selatan'} {distText ? `· ${distText}` : ''}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

