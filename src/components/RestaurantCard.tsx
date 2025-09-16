import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import type { Restaurant } from '@/types';
import type { LatLong } from '@/lib/geo';
import { distanceKm, formatKm } from '@/lib/geo';
import { useRestaurant } from '@/services/queries/restaurants';

export default function RestaurantCard({
  restaurant,
  userPos,
}: {
  restaurant: Restaurant;
  userPos?: LatLong;
}) {
  
  const needsCoords = !restaurant.coords;
  const { data } = useRestaurant(needsCoords ? restaurant.id : undefined);
  const hydrated = data?.restaurant;
  const coords = restaurant.coords ?? hydrated?.coords;
  const km =
    userPos && coords
      ? distanceKm(userPos, coords)
      : restaurant.distanceKm ?? hydrated?.distanceKm;
  const distText = formatKm(km);

  return (
    <Link to={`/restaurant/${restaurant.id}`}>
      <Card className='overflow-hidden shadow-sm border border-neutral-200'>
        <CardContent className='flex gap-3'>
          <div className='h-[90px] sm:h-30 max-w-[396px] bg-white flex items-center'>
            {restaurant.logoUrl ? (
              <img
                src={restaurant.logoUrl || '/fallbackresto.png'}
                alt={restaurant.name}
                className='h-full w-full object-contain '
              />
            ) : (
              <span className='text-zinc-500'>{restaurant.name}</span>
            )}
          </div>

          <div className='my-auto text-gray-950 flex flex-col items-start gap-2 sm:gap-3'>
            <div className='sm:text-lg font-semibold'>{restaurant.name}</div>
            <span>⭐ {restaurant.rating ?? '4.9'}</span>

            {/* <span className='text-zinc-400'>•</span> */}
            <span className='text-md font-normal text-gray-950 '>
              {restaurant.address ?? 'Jakarta Selatan'}{' '}
              {distText ? `· ${distText}` : ''}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
