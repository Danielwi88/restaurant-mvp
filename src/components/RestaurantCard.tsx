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

            <div className='flex gap-1 items-center'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='17.2'
                height='16.3'
                viewBox='0 0 18 18'
                fill='none'
                className='shrink-0'
              >
                <path
                  d='M9.00033 14.275L4.85033 16.775C4.667 16.8916 4.47533 16.9416 4.27533 16.9249C4.07533 16.9083 3.90033 16.8416 3.75033 16.725C3.60033 16.6083 3.48366 16.4626 3.40033 16.288C3.317 16.1133 3.30033 15.9173 3.35033 15.7L4.45033 10.975L0.775329 7.79995C0.608662 7.64995 0.504662 7.47895 0.463329 7.28695C0.421996 7.09495 0.434329 6.90762 0.500329 6.72495C0.566329 6.54228 0.666329 6.39228 0.800329 6.27495C0.934329 6.15762 1.11766 6.08262 1.35033 6.04995L6.20033 5.62495L8.07533 1.17495C8.15866 0.974951 8.288 0.824951 8.46333 0.724951C8.63866 0.624951 8.81766 0.574951 9.00033 0.574951C9.183 0.574951 9.362 0.624951 9.53733 0.724951C9.71266 0.824951 9.842 0.974951 9.92533 1.17495L11.8003 5.62495L16.6503 6.04995C16.8837 6.08328 17.067 6.15828 17.2003 6.27495C17.3337 6.39162 17.4337 6.54162 17.5003 6.72495C17.567 6.90829 17.5797 7.09595 17.5383 7.28795C17.497 7.47995 17.3927 7.65062 17.2253 7.79995L13.5503 10.975L14.6503 15.7C14.7003 15.9166 14.6837 16.1126 14.6003 16.288C14.517 16.4633 14.4003 16.609 14.2503 16.725C14.1003 16.841 13.9253 16.9076 13.7253 16.9249C13.5253 16.9423 13.3337 16.8923 13.1503 16.775L9.00033 14.275Z'
                  fill='#FFAB0D'
                />
              </svg>
              <span className='flex items-center text-[16px] font-medium text-gray-950'>
                {restaurant.rating ?? '4.9'}
              </span>
            </div>

            {/* <span className='text-gray-400'>•</span> */}
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
