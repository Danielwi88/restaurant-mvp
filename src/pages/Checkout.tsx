import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { clearCart, updateQty, decrementQty } from '@/features/cart/cartSlice';
import type { RootState } from '@/features/store';
import { useAppDispatch, useAppSelector } from '@/features/store';
import { formatCurrency } from '@/lib/format';
import { showToast } from '@/lib/toast';
import { apiDelete, apiPost, apiPut } from '@/services/api/axios';
import { useCreateOrder } from '@/services/queries/orders';
import { MinusIcon, PlusIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useRestaurant } from '@/services/queries/restaurants';

export default function Checkout() {
  const d = useAppDispatch();
  const items = useAppSelector((s: RootState) => s.cart.items);
  const total = items.reduce((a, b) => a + b.price * b.qty, 0);
  const deliveryFee = 10_000;
  const serviceFee = 1_000;
  const grandTotal = total + deliveryFee + serviceFee;
  const createOrder = useCreateOrder();
  const nav = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [pendingRemove] = useState<Record<string, boolean>>({});

  const [addr, setAddr] = useState({
    name: '',
    phone: '',
    address: '',
    notes: '',
  });
  const [editing, setEditing] = useState(false);

  // Payment method selection (visual only for now)
  const methods = [
    { id: 'bni', label: 'Bank Negara Indonesia', logo: '/BNI.svg' },
    { id: 'bri', label: 'Bank Rakyat Indonesia', logo: '/BRI.svg' },
    { id: 'bca', label: 'Bank Central Asia', logo: '/BCA.svg' },
    { id: 'mandiri', label: 'Mandiri', logo: '/Mandiri.svg' },
  ] as const;
  const [method, setMethod] = useState<(typeof methods)[number]['id']>('bni');
  const [isPlacing, setIsPlacing] = useState(false);

  useEffect(() => {
    if (items.length === 0) {
      nav('/cart', { replace: true });
    }
  }, [items.length, nav]);

  type CheckoutApiBody = {
    paymentMethod: string;
    deliveryAddress: string;
    notes?: string;
  };
  type CheckoutApiResponse = {
    success?: boolean;
    message?: string;
    data?: {
      transaction?: {
        id?: number;
        transactionId?: string;
        paymentMethod?: string;
        status?: string;
        pricing?: {
          subtotal?: number;
          serviceFee?: number;
          deliveryFee?: number;
          totalPrice?: number;
        };
        restaurants?: Array<{
          restaurant?: { id?: number; name?: string; logo?: string };
          items?: Array<{
            menuId?: number;
            menuName?: string;
            price?: number;
            quantity?: number;
            itemTotal?: number;
          }>;
          subtotal?: number;
        }>;
        createdAt?: string;
      };
    };
  };

  const buy = async () => {
    setIsPlacing(true);
    showToast('Your transaction is being processed');
    try {
      // Sync local cart to server before placing order
      const tokenNow =
        typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (tokenNow) {
        const ops = items.map(async (it) => {
          if (it.serverCartItemId) {
            await apiPut(`cart/${it.serverCartItemId}`, { quantity: it.qty });
          } else if (it.restaurantId) {
            const rnum = Number(it.restaurantId);
            const mnum = Number(it.id);
            await apiPost('cart', {
              restaurantId: Number.isFinite(rnum) ? rnum : it.restaurantId,
              menuId: Number.isFinite(mnum) ? mnum : it.id,
              quantity: it.qty,
            });
          }
        });
        await Promise.allSettled(ops);
      }
      // Post finalized checkout payload as requested
      const methodLabel = (() => {
        const m = [
          { id: 'bni', label: 'Bank Negara Indonesia' },
          { id: 'bri', label: 'Bank Rakyat Indonesia' },
          { id: 'bca', label: 'Bank Central Asia' },
          { id: 'mandiri', label: 'Mandiri' },
        ].find((x) => x.id === method);
        return m?.label ?? method;
      })();

      const checkoutRes = await apiPost<CheckoutApiResponse>('order/checkout', {
        paymentMethod: methodLabel,
        deliveryAddress: addr.address.trim(),
        notes: addr.notes?.trim() || '',
      } as CheckoutApiBody);

      // Navigate to success first
      nav('/success', {
        replace: true,
        state: {
          summary: {
            date: new Date().toISOString(),
            paymentMethod: methodLabel,
            subtotal: total,
            deliveryFee,
            serviceFee,
            total: total + deliveryFee + serviceFee,
            itemsCount: items.length,
            api: checkoutRes,
          },
        },
      });

      // clear the cart in background (server + local)
      void (async () => {
        try {
          await apiDelete('cart');
        } catch {
          /* err */
        }
        d(clearCart());
      })();
    } catch (err) {
      if (import.meta.env.DEV)
        console.error('[checkout] create order failed', err);
    } finally {
      setIsPlacing(false);
    }
  };

  const restaurantIds = useMemo(
    () =>
      Array.from(
        new Set(items.map((i) => i.restaurantId).filter(Boolean))
      ) as string[],
    [items]
  );

  const groups = useMemo(() => {
    const map = new Map<string, typeof items>();
    for (const it of items) {
      const key = it.restaurantId ?? 'other';
      const next = map.get(key) ?? [];
      next.push(it);
      map.set(key, next);
    }
    return Array.from(map.entries()).map(([restaurantId, list]) => ({
      restaurantId,
      items: list,
    }));
  }, [items]);

  const getAddItemHref = (restaurantId?: string) => {
    if (restaurantId && restaurantId !== 'other')
      return `/restaurant/${restaurantId}`;
    if (restaurantIds.length === 1) return `/restaurant/${restaurantIds[0]!}`;
    return '/categories';
  };

  const RestaurantHeading = ({ restaurantId }: { restaurantId: string }) => {
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const canFetch = !!token && restaurantId !== 'other';
    const { data } = useRestaurant(canFetch ? restaurantId : undefined);
    const name = data?.restaurant?.name ?? 'Restaurant';
    const logo = data?.restaurant?.logoUrl ?? '/fallback1.png';
    return (
      <div className='flex items-center gap-2 text-sm sm:text-lg font-semibold text-gray-950'>
        <img
          src={logo}
          alt={name}
          className='size-5 rounded-sm object-cover'
          onError={(e) => {
            const img = e.currentTarget as HTMLImageElement;
            if (!img.src.includes('/fallback1.png')) {
              img.onerror = null;
              img.src = '/fallback1.png';
            }
          }}
        />
        <span>{name}</span>
      </div>
    );
  };

  return (
    <>
      <Navbar />
      <div className='max-w-[1000px] mx-4 sm:mx-auto py-10 sm:py-12 overflow-hidden'>
        <h2 className='text-[32px] font-extrabold mb-4 sm:mb-8'>Checkout</h2>

        <div className='grid gap-5 lg:grid-cols-[minmax(0,590px)_minmax(0,1fr)] lg:items-start'>
          {/* Left: Address + Items */}
          <div className='w-full mx-auto lg:mx-0 lg:max-w-[590px] space-y-6'>
            {/* Delivery Address card */}
            <Card className='w-full  rounded-2xl border border-neutral-200 shadow-sm'>
              <CardContent className='p-0'>
                <div className='flex items-start justify-between'>
                  <div>
                    <div className='flex items-center gap-2 text-zinc-800 text-[16px] sm:text-lg font-extrabold leading-8'>
                      <img
                        src='/pointRed.png'
                        alt='point'
                        width='32'
                        height='32'
                        className='size-8 '
                      />
                      Delivery Address
                    </div>
                    {!editing ? (
                      <div className='mt-2 text-sm sm:text-[16px] text-gray-950'>
                        <div>{addr.address || 'Set your delivery address'}</div>
                        {addr.phone && <div className='mt-1'>{addr.phone}</div>}
                      </div>
                    ) : (
                      <div className='grid sm:grid-cols-2 gap-4 mt-3'>
                        <div>
                          <Label htmlFor='name'>Full Name</Label>
                          <Input
                            id='name'
                            value={addr.name}
                            onChange={(e) =>
                              setAddr((a) => ({ ...a, name: e.target.value }))
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor='phone'>Phone Number</Label>
                          <Input
                            id='phone'
                            value={addr.phone}
                            onChange={(e) =>
                              setAddr((a) => ({ ...a, phone: e.target.value }))
                            }
                          />
                        </div>
                        <div className='sm:col-span-2'>
                          <Label htmlFor='address'>Address</Label>
                          <textarea
                            id='address'
                            value={addr.address}
                            onChange={(e) =>
                              setAddr((a) => ({
                                ...a,
                                address: e.target.value,
                              }))
                            }
                            className='w-full border rounded-md p-3 min-h-28 outline-none focus:ring-2 focus:ring-[var(--color-brand,#D22B21)]/30'
                          />
                        </div>
                        <div className='sm:col-span-2'>
                          <Label htmlFor='notes'>Notes (optional)</Label>
                          <textarea
                            id='notes'
                            value={addr.notes}
                            onChange={(e) =>
                              setAddr((a) => ({ ...a, notes: e.target.value }))
                            }
                            className='w-full border rounded-md p-3 min-h-20 outline-none focus:ring-2 focus:ring-[var(--color-brand,#D22B21)]/30'
                            placeholder='Please ring the doorbell'
                          />
                        </div>
                      </div>
                    )}
                    <div className='ml-0 mt-5'>
                      <Button
                        variant={editing ? 'default' : 'outline'}
                        className='w-[120px] bg-white text-gray-950 cursor-pointer hover:scale-105 border border-gray-300 h-10 text-sm sm:text-[16px] font-bold rounded-full'
                        onClick={() => setEditing((e) => !e)}
                      >
                        {editing ? 'Save' : 'Change'}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Items Card */}
            <Card className='rounded-2xl border-none shadow-md'>
              <CardContent className='p-0'>
                <div className='flex items-center justify-between px-5 pt-0'>
                  {!items.length && (
                    <Button
                      asChild
                      variant='outline'
                      className='rounded-full h-8 px-3 text-sm'
                    >
                      <Link to={getAddItemHref()}>Add item</Link>
                    </Button>
                  )}
                </div>
                <div className='px-0 pb-0'>
                  <div className='mt-0 space-y-6'>
                    {groups.map((group, groupIndex) => (
                      <div key={group.restaurantId} className='space-y-4'>
                        <div className='flex items-center justify-between'>
                          <RestaurantHeading
                            restaurantId={group.restaurantId}
                          />
                          <Button
                            asChild
                            variant='outline'
                            className='rounded-full text-sm sm:text-[16px] h-9 sm:h-10 px-6 sm:px-[27px] hover:font-bold hover:-translate-y-0.5'
                          >
                            <Link
                              to={getAddItemHref(
                                group.restaurantId !== 'other'
                                  ? group.restaurantId
                                  : undefined
                              )}
                            >
                              Add item
                            </Link>
                          </Button>
                        </div>
                        <div className='space-y-3 sm:space-y-5'>
                          {group.items.map((i) =>
                            pendingRemove[i.id] ? (
                              <div
                                key={i.id}
                                className='flex items-center gap-x-[17px]'
                              >
                                <Skeleton className='h-16 w-16 rounded-lg' />
                                <div className='flex-1 space-y-2'>
                                  <Skeleton className='h-4 w-40' />
                                  <Skeleton className='h-4 w-24' />
                                </div>
                                <Skeleton className='h-8 w-24 rounded-full' />
                              </div>
                            ) : (
                              <div
                                key={i.id}
                                className='flex items-center gap-x-[17px]'
                              >
                                <img
                                  src={i.imageUrl || '/iconRectangle.png'}
                                  alt={i.name}
                                  className='h-20 w-20 object-cover rounded-lg'
                                  onError={(e) => {
                                    const img =
                                      e.currentTarget as HTMLImageElement;
                                    if (
                                      !img.src.includes('/iconRectangle.png')
                                    ) {
                                      img.onerror = null;
                                      img.src = '/fallback1.png';
                                    }
                                  }}
                                />
                                <div className='flex-1'>
                                  <div className='text-sm sm:text-[16px] leading-[30px] text-gray-950'>
                                    {i.name}
                                  </div>
                                  <div className='text-gray-950 font-extrabold text-lg leading-[32px]'>
                                    {formatCurrency(i.price)}
                                  </div>
                                </div>
                                <div className='flex items-center gap-2'>
                                  <button
                                className='size-9 sm:size-10 rounded-full border border-neutral-300 grid place-items-center text-gray-950 disabled:opacity-60  cursor-pointer'
                                    aria-label='Decrease'
                                    onClick={() => {
                                      d(decrementQty({ id: i.id }));
                                    }}
                                    disabled={pendingRemove[i.id]}
                                  >
                                    <MinusIcon className='size-5 sm:size-6' />
                                  </button>
                                  <div className='px-4 text-center text-[16px] sm:text-lg font-semibold'>
                                    {i.qty}
                                  </div>
                                  <button
                                    className='size-9 sm:size-10 rounded-full bg-[var(--color-brand,#D22B21)] text-white grid place-items-center disabled:opacity-60 cursor-pointer'
                                    aria-label='Increase'
                                    onClick={() => {
                                      const next = i.qty + 1;
                                      d(updateQty({ id: i.id, qty: next }));
                                    }}
                                    disabled={pendingRemove[i.id]}
                                  >
                                    <PlusIcon className='size-5 sm:size-6 ' />
                                  </button>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                        {groupIndex < groups.length - 1 && (
                          <Separator className='!my-2' />
                        )}
                      </div>
                    ))}
                  </div>
                  {!items.length && (
                    <div className='mt-6 flex items-center justify-between rounded-lg border border-dashed border-neutral-200 p-4 text-sm text-zinc-500'>
                      <span>No items.</span>
                      <Button asChild size='sm' variant='outline'>
                        <Link to={getAddItemHref()}>Browse menu</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {createOrder.error && (
              <p className='text-sm text-red-600'>
                Failed to create order. Please try again.
              </p>
            )}
          </div>

          {/* Right: Payment + Summary */}
          <aside className='w-full relative mx-auto lg:mx-0 lg:max-w-[400px] space-y-0'>
            <span
              className='hidden sm:block absolute -left-3 top-93 -translate-y-1/2 size-7 rounded-full bg-neutral-50 border border-gray-50'
              aria-hidden='true'
            />
            <span
              className='hidden sm:block absolute -right-3 top-93 -translate-y-1/2 size-7 rounded-full bg-neutral-50 border border-gray-50'
              aria-hidden='true'
            />

            <Card className='rounded-2xl border-none shadow-sm'>
              <CardContent className='p-0'>
                <div className='px-0 pt-0 font-extrabold mb-4 text-[16px] sm:text-lg'>
                  Payment Method
                </div>
                <div className='px-0 pb-2'>
                  <div className='border-none overflow-hidden'>
                    {methods.map((m) => {
                      const isActive = method === m.id;
                      return (
                        <label
                          key={m.id}
                          className={`flex items-center justify-between gap-4 px-4 py-3 text-sm sm:text-[16px] border-b border-neutral-200 last:border-b-0 transition-colors ${isActive ? 'bg-white' : 'bg-white hover:scale-105'}`}
                        >
                          <div className='flex items-center gap-3'>
                            <span className='flex size-11 items-center justify-center overflow-hidden rounded-xl border border-neutral-200 bg-white'>
                              <img
                                src={m.logo}
                                alt={m.label}
                                className='max-h-full max-w-full object-contain cursor-pointer'
                                onError={(e) => {
                                  const img = e.currentTarget as HTMLImageElement;
                                  img.style.visibility = 'hidden';
                                }}
                              />
                            </span>
                            <span className='text-gray-950 cursor-pointer text-sm sm:text-[16px] font-medium'>{m.label}</span>
                          </div>
                          <input
                            type='radio'
                            name='method'
                            checked={isActive}
                            onChange={() => setMethod(m.id)}
                            className='accent-[var(--color-brand,#D22B21)] cursor-pointer size-5 sm:size-6'
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className='norder border-1 border-dashed border-gray-300' />
            <Card className='rounded-2xl border-none shadow-md'>
              <CardContent className='p-0'>
                <div className='font-extrabold mb-4 text-lg sm:text-[16px] '>
                  Payment Summary
                </div>
                <div className='flex justify-between text-sm sm:text-[16px] mb-4  text-gray-950'>
                  <span>
                    Price ({items.length}{' '}
                    {items.length === 1 ? 'item' : 'items'})
                  </span>
                  <span>{formatCurrency(total)}</span>
                </div>
                <div className='flex justify-between text-sm sm:text-[16px] mb-4  text-gray-950'>
                  <span>Delivery Fee</span>
                  <span>{formatCurrency(deliveryFee)}</span>
                </div>
                <div className='flex justify-between text-sm sm:text-[16px] mb-4  text-gray-950'>
                  <span>Service Fee</span>
                  <span>{formatCurrency(serviceFee)}</span>
                </div>
                <Separator className='my-3' />
                <div className='flex justify-between font-bold mb-4'>
                  <span>Total</span>
                  <span>{formatCurrency(grandTotal)}</span>
                </div>
                <Button
                  className='w-full text-[16px] hover:scale-105 font-bold rounded-full h-11 sm:h-12 cursor-pointer hover:shadow-md hover:-translate-y-0.5'
                  onClick={() => setConfirmOpen(true)}
                  disabled={!items.length || isPlacing}
                >
                  {isPlacing ? 'Processing…' : 'Buy'}
                </Button>
              </CardContent>
            </Card>
            {/* Confirm Payment Dialog */}
            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
              <DialogContent className='sm:max-w-md'>
                <DialogHeader>
                  <DialogTitle className='text-lg font-bold'>Confirm Payment</DialogTitle>
                </DialogHeader>
                <div className='text-sm sm:text-[16px] text-gray-950'>
                  Proceed to pay{' '}
                  <span className='font-extrabold'>
                    {formatCurrency(grandTotal)}
                  </span>{' '}
                  for this order?
                </div>
                <DialogFooter>
                  <Button
                    variant='outline'
                    onClick={() => setConfirmOpen(false)}
                    className='cursor-pointer text-sm sm:text-[16px] hover:font-extrabold'
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      setConfirmOpen(false);
                      buy();
                    }}
                    disabled={isPlacing}
                    className='cursor-pointer text-sm sm:text-[16px] hover:font-extrabold'
                  >
                    Yes, Pay
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </aside>
        </div>
        {isPlacing && (
          <div className='fixed inset-0 z-[60] bg-white/70 backdrop-blur-[2px] grid place-items-center'>
            <Card className='w-full max-w-sm shadow-sm'>
              <CardContent className='p-5'>
                <div className='text-sm font-medium mb-3'>
                  Processing payment…
                </div>
                <div className='space-y-3'>
                  <div className='flex items-center gap-3'>
                    <Skeleton className='h-4 w-24' />
                    <Skeleton className='h-4 w-28' />
                  </div>
                  <div className='flex items-center gap-3'>
                    <Skeleton className='h-4 w-36' />
                    <Skeleton className='h-4 w-16' />
                  </div>
                  <div className='flex items-center gap-3'>
                    <Skeleton className='h-4 w-28' />
                    <Skeleton className='h-4 w-20' />
                  </div>
                  <Separator />
                  <div className='flex items-center gap-3'>
                    <Skeleton className='h-5 w-16' />
                    <Skeleton className='h-5 w-24' />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}
