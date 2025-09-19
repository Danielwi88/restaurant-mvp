import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { MenuItem } from '@/types';
import { formatKm } from '@/lib/geo';
import { formatCurrency } from '@/lib/format';
import { useAppDispatch, useAppSelector } from '@/features/store';
import {
  addToCart,
  incrementQty,
  decrementQty,
} from '@/features/cart/cartSlice';
import {
  useAddCartItem,
  type AddCartResponse,
} from '@/services/queries/orders';
import { showToast } from '@/lib/toast';

export default function ProductCard({
  item,
  distanceKm,
  localOnly,
}: {
  item: MenuItem;
  distanceKm?: number;
  localOnly?: boolean;
}) {
  const d = useAppDispatch();
  const addServer = useAddCartItem();
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const qty = useAppSelector(
    (s) => s.cart.items.find((i) => i.id === item.id)?.qty ?? 0
  );

  const onAdd = () => {
    if (localOnly) {
      d(
        addToCart({
          id: item.id,
          name: item.name,
          price: item.price,
          qty: 1,
          imageUrl: item.imageUrl,
          restaurantId: item.restaurantId,
        })
      );
      showToast('Added to cart', 'success');
      return;
    }
    if (token && item.restaurantId) {
      const restaurantIdNum = Number(item.restaurantId);
      const menuIdNum = Number(item.id);
      addServer.mutate(
        {
          restaurantId: Number.isFinite(restaurantIdNum)
            ? restaurantIdNum
            : (item.restaurantId as string),
          menuId: Number.isFinite(menuIdNum) ? menuIdNum : (item.id as string),
          quantity: 1,
        },
        {
          onSuccess: (res: AddCartResponse) => {
            // reflect in local cart for immediate UX and badge count
            const serverId = res?.data?.cartItem?.id;
            d(
              addToCart({
                id: item.id,
                name: item.name,
                price: item.price,
                qty: 1,
                imageUrl: item.imageUrl,
                restaurantId: item.restaurantId,
                serverCartItemId: serverId ? String(serverId) : undefined,
              })
            );
            showToast('Item added to cart successfully', 'success');
          },
          onError: () => {
            // Fallback to local cart if server add failed
            d(
              addToCart({
                id: item.id,
                name: item.name,
                price: item.price,
                qty: 1,
                imageUrl: item.imageUrl,
                restaurantId: item.restaurantId,
              })
            );
            showToast('Added to cart', 'success');
          },
        }
      );
    } else {
      d(
        addToCart({
          id: item.id,
          name: item.name,
          price: item.price,
          qty: 1,
          imageUrl: item.imageUrl,
          restaurantId: item.restaurantId,
        })
      );
      showToast('Added to cart', 'success');
    }
  };
  return (
    <Card className='overflow-hidden gap-0 p-0 sm:p-0 rounded-2xl shadow-xs'>
      <img
        src={item.imageUrl || '/fallback1.png'}
        alt={item.name}
        className='h-[172.5px] sm:h-[285px] w-full object-cover'
        onError={(e) => {
          const img = e.currentTarget as HTMLImageElement;
          if (!img.src.includes('/fallback1.png')) {
            img.onerror = null;
            img.src = '/fallback1.png';
          }
        }}
      />
      <CardContent className='px-4 pb-4 pt-3 space-y-3'>
        <div className='flex items-start justify-between gap-3'>
          <div className='flex-1 min-w-0'>
            <div className='text-sm sm:text-base font-medium text-gray-950 line-clamp-2 min-h-[2lh] sm:min-h-[1lh] overflow-hidden'>
              {item.name}
            </div>
            <div className='mt-1 text-lg font-extrabold text-gray-950'>
              {formatCurrency(item.price)}
            </div>
          </div>
          {typeof distanceKm === 'number' && (
            <div className='shrink-0 text-xs text-zinc-600'>
              {formatKm(distanceKm)}
            </div>
          )}
        </div>

        {qty > 0 ? (
          <div className='flex items-center justify-center gap-4'>
            <button
              className='size-8 xs:size-9 sm:size-10 rounded-full border border-neutral-300 grid place-items-center text-gray-950 text-lg sm:text-xl cursor-pointer'
              aria-label='Decrease quantity'
              onClick={() => d(decrementQty({ id: item.id }))}
            >
              -
            </button>
            <div
              className='w-0 xs:w-4 sm:w-8 text-center text-base sm:text-lg font-semibold'
              aria-live='polite'
            >
              {qty}
            </div>
            <button
              className='size-8 xs:size-9 sm:size-10 rounded-full bg-[var(--color-brand,#D22B21)] text-white grid place-items-center text-lg sm:text-xl cursor-pointer'
              aria-label='Increase quantity'
              onClick={() => d(incrementQty({ id: item.id }))}
            >
              +
            </button>
          </div>
        ) : (
          <Button
            className='w-full h-9 sm:h-10 rounded-full cursor-pointer'
            onClick={onAdd}
            disabled={!localOnly && addServer.isPending}
          >
            {!localOnly && addServer.isPending ? 'Adding…' : 'Add'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
