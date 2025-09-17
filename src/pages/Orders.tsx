import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  LogoutDialog,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency } from '@/lib/format';
import { showToast } from '@/lib/toast';
import { useOrders } from '@/services/queries/orders';
import { useServerCart } from '@/services/queries/cart';
import { useRestaurantMenuImages } from '@/services/queries/menu-images';
import { useCreateReview } from '@/services/queries/reviews';
import { useQueryClient } from '@tanstack/react-query';
import { MapPinIcon, StarIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type StatusTab =
  | 'preparing'
  | 'on_the_way'
  | 'delivered'
  | 'done'
  | 'canceled'
  | 'all';

type StoredUser = { name?: string; avatar?: string; avatarUrl?: string };

type OrderItem = {
  id?: string | number;
  name: string;
  imageUrl?: string | null;
  price: number;
  qty: number;
};

type Order = {
  id: string | number;
  items: OrderItem[];
  total: number;
  transactionId: string;
  restaurantId: string | number;
  restaurantName?: string | null;
  createdAt: string | Date;
};

export default function Orders() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
  });

  const [status, setStatus] = useState<StatusTab>('all');
  const [q, setQ] = useState('');
  const { data, isLoading } = useOrders(
    status === 'all' ? undefined : { status }
  );
  const createReview = useCreateReview();
  const [reviewOpen, setReviewOpen] = useState(false);
  const [rating, setRating] = useState(4);
  const [comment, setComment] = useState('');
  const [current, setCurrent] = useState<{
    tx?: string;
    rid?: string;
    rname?: string;
  } | null>(null);
  const [user, setUser] = useState<StoredUser | null>(null);
  const [canFetchCart, setCanFetchCart] = useState(false);
  const nav = useNavigate();
  const qc = useQueryClient();
  const avatarUrl = user?.avatarUrl ?? user?.avatar ?? null;
  const name = user?.name || 'John Doe';

  const [logoutOpen, setLogoutOpen] = useState(false);
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setCanFetchCart(false);
    qc.clear();
    showToast('Logged out successfully', 'success');
    nav('/');
  };

  const filtered = useMemo(() => {
    const list: Order[] = Array.isArray(data) ? (data as Order[]) : [];
    const s = q.trim().toLowerCase();
    if (!s) return list;
    return list.filter(
      (order) =>
        order.items.some((i) => i.name.toLowerCase().includes(s)) ||
        new Date(order.createdAt).toLocaleString().toLowerCase().includes(s)
    );
  }, [data, q]);

  const { data: serverCart } = useServerCart(canFetchCart);

  const cartImageMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of serverCart?.items ?? []) {
      if (item.id && item.imageUrl) {
        map.set(String(item.id), item.imageUrl);
      }
    }
    return map;
  }, [serverCart]);

  const missingMenuRequests = useMemo(() => {
    const grouped = new Map<string, Set<string>>();
    for (const order of filtered) {
      const first = order.items[0];
      if (!first) continue;
      const firstId =
        first.id !== undefined && first.id !== null
          ? String(first.id)
          : undefined;
      if (!firstId) continue;
      if (first.imageUrl || cartImageMap.has(firstId)) continue;
      const rid =
        order.restaurantId !== undefined && order.restaurantId !== null
          ? String(order.restaurantId)
          : undefined;
      if (!rid) continue;
      const set = grouped.get(rid) ?? new Set<string>();
      set.add(firstId);
      grouped.set(rid, set);
    }
    return Array.from(grouped.entries()).map(([restaurantId, ids]) => ({
      restaurantId,
      menuIds: Array.from(ids.values()),
    }));
  }, [filtered, cartImageMap]);

  const { data: restaurantImageMapData } = useRestaurantMenuImages(
    missingMenuRequests,
    {
      enabled: missingMenuRequests.length > 0,
    }
  );

  const restaurantImageMap = useMemo(
    () => restaurantImageMapData ?? new Map<string, string>(),
    [restaurantImageMapData]
  );

  const tabs: { id: StatusTab; label: string }[] = [
    { id: 'preparing', label: 'Preparing' },
    { id: 'on_the_way', label: 'On the Way' },
    { id: 'delivered', label: 'Delivered' },
    { id: 'done', label: 'Done' },
    { id: 'canceled', label: 'Canceled' },
    { id: 'all', label: 'All' },
  ];

  useEffect(() => {
    try {
      const raw = localStorage.getItem('user');
      if (raw) {
        const u = JSON.parse(raw) as StoredUser & {
          email?: string;
          phone?: string;
        };
        setUser(u);
        setForm((f) => ({
          ...f,
          name: u.name ?? '',
          email: u.email ?? '',
          phone: u.phone ?? '',
        }));
      }
    } catch {
      // ignore JSON parse errors
    }
    setCanFetchCart(!!localStorage.getItem('token'));
  }, []);

  return (
    <>
      <Navbar />
      <div className='max-w-[1200px] bg-neutral-50 mt-4 sm:mt-12 mx-auto px-4 sm:px-5 lg:px-0 md:grid grid-cols-[240px_1fr] gap-8'>
        {/* Left menu (profile-style) */}
        <aside className='hidden md:block w-[240px] border-none'>
          <Card className='rounded-2xl shadow-[0_0_20px_rgba(203,202,202,0.25)]'>
            <CardContent className='p-0 space-y-12'>
              <div className='flex items-center gap-3'>
                <Avatar className='size-10 sm:size-12 shrink-0 aspect-square bg-black p-0'>
                  <AvatarImage
                    src={avatarUrl}
                    alt={name}
                    className='object-contain object-center'
                  />
                </Avatar>
                <div className='font-medium'>{form.name || 'User'}</div>
              </div>

              <div className='space-y-6 text-sm'>
                <div className='flex items-center gap-2 text-gray-950 cursor-pointer'>
                  <MapPinIcon className='size-5' /> Delivery Address
                </div>
                <button
                  onClick={() => (window.location.href = '/orders')}
                  className='flex items-center gap-2 text-gray-950 cursor-pointer'
                >
                  <img src='/file-05.svg' alt='file' width='20' height='20' />{' '}
                  My Orders
                </button>
                <button
                  onClick={() => setLogoutOpen(true)}
                  className=' cursor-pointer flex items-center gap-2 text-gray-950'
                >
                  <img
                    src='/arrow-circle-broken-left.svg'
                    alt='arrow'
                    width='20'
                    height='20'
                  />{' '}
                  Logout
                </button>
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* Right content */}
        <section>
          <h2 className='text-2xl font-semibold mb-4'>My Orders</h2>
          <Card className='rounded-2xl shadow-[0_0_20px_rgba(203,202,202,0.25)] border-none bg-white'>
            <CardContent className='sm:p-2'>
              <div className='flex items-center gap-3 '>
                <div className='relative w-full max-w-[598px]  '>
                  <span className='absolute left-3 top-1/2 -translate-y-1/2  text-gray-500 font-normal'>
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      width='20'
                      height='20'
                      viewBox='0 0 20 20'
                      fill='none'
                    >
                      <path
                        d='M17.5 17.5L14.1667 14.1667M15.8333 9.16667C15.8333 10.9348 15.131 12.6305 13.8807 13.8807C12.6305 15.131 10.9348 15.8333 9.16667 15.8333C7.39856 15.8333 5.70286 15.131 4.45262 13.8807C3.20238 12.6305 2.5 10.9348 2.5 9.16667C2.5 7.39856 3.20238 5.70286 4.45262 4.45262C5.70286 3.20238 7.39856 2.5 9.16667 2.5C10.9348 2.5 12.6305 3.20238 13.8807 4.45262C15.131 5.70286 15.8333 7.39856 15.8333 9.16667Z'
                        stroke='currentColor'
                        strokeWidth='1.25'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                      />
                    </svg>
                  </span>
                  <Input
                    type='text'
                    placeholder='Search'
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className='pl-10 rounded-full text-gray-600 text-sm font-normal border-gray-300'
                  />
                </div>
              </div>
              <div className='mt-5 flex flex-wrap gap-y-2 gap-x-2 sm:gap-x-3'>
                <span className='text-sm sm:text-[18px] font-bold flex items-center'>
                  Status
                </span>
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setStatus(t.id)}
                    className={`px-4 py-2 rounded-full border  text-sm sm:text-[16px] ${
                      status === t.id
                        ? ' text-brand border-brand bg-[#FFECEC]'
                        : 'bg-white text-neutral-950 border-gray-300'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className='mt-5 space-y-4 '>
                {isLoading && (
                  <div className='text-gray-500'>Loading orders…</div>
                )}

                {!isLoading &&
                  filtered.map((order) => {
                    const first = order.items[0];
                    const summary = first
                      ? `${first.qty} × ${formatCurrency(first.price)}`
                      : '';
                    const firstId =
                      first?.id !== undefined && first?.id !== null
                        ? String(first.id)
                        : null;
                    const resolvedImage =
                      (firstId ? cartImageMap.get(firstId) : undefined) ??
                      (firstId ? restaurantImageMap.get(firstId) : undefined) ??
                      (first?.imageUrl || undefined) ??
                      '/fallback2.png';
                    return (
                      <Card
                        key={order.id}
                        className='rounded-2xl border-none shadow-[0_0_20px_rgba(203,202,202,0.25)]'
                      >
                        <CardContent className='p-1'>
                          <div className='flex gap-2 mb-4'>
                            <img
                              src='/iconRectangle.png'
                              alt='icon'
                              width='32'
                              height='32'
                            />

                            <div className='text-sm leading-[28px] sm:text-lg sm:leading-[32px] font-bold'>
                              {order.restaurantName || 'Restaurant'}
                            </div>
                          </div>

                          <div className='flex items-center gap-3'>
                            <img
                              src={resolvedImage}
                              alt={first?.name || 'food'}
                              className='h-16 w-16 object-cover rounded-xl'
                              onError={(e) => {
                                const img = e.currentTarget as HTMLImageElement;
                                if (!img.src.includes('/fallback2.png')) {
                                  img.onerror = null;
                                  img.src = '/fallback2.png';
                                }
                              }}
                            />

                            <div className='flex-1'>
                              <div className='font-medium text-sm sm:text-[16px] leading-[28px]'>
                                {first?.name || 'Order'}
                              </div>
                              <div className='text-sm sm:text-[16px] text-gray-950 font-extrabold'>
                                {summary}
                              </div>
                            </div>
                          </div>
                          <div className='mt-3 sm:mt-8 flex justify-between'>
                            <div className='text-left'>
                              <div className='text-[16px] text-zinc-500'>
                                Total
                              </div>
                              <div className='font-extrabold sm:text-xl'>
                                {formatCurrency(order.total)}
                              </div>
                            </div>
                            <Button
                              className='rounded-full px-5 h-[48px] w-[240px]'
                              onClick={() => {
                                setCurrent({
                                  tx: order.transactionId,
                                  rid: order.restaurantId as string | undefined,
                                  rname: order.restaurantName || undefined,
                                });
                                setReviewOpen(true);
                              }}
                            >
                              Give Review
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}

                {!isLoading && filtered.length === 0 && (
                  <Card>
                    <CardContent className='p-6 text-center text-zinc-500'>
                      No orders found.
                    </CardContent>
                  </Card>
                )}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
      <Footer />

      {/* Give Review Modal */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className=' sm:max-w-md rounded-2xl'>
          <DialogHeader>
            <DialogTitle>Give Review</DialogTitle>
          </DialogHeader>
          <div className='text-sm text-gray-950'>Give Rating</div>
          <div className='mt-1 flex items-center gap-1'>
            {Array.from({ length: 5 }).map((_, i) => {
              const idx = i + 1;
              const active = rating >= idx;
              return (
                <button
                  key={idx}
                  aria-label={`rate ${idx}`}
                  onClick={() => setRating(idx)}
                >
                  <StarIcon
                    className={`size-6 ${
                      active
                        ? 'text-yellow-500 fill-yellow-500'
                        : 'text-zinc-300'
                    }`}
                  />
                </button>
              );
            })}
          </div>
          <Textarea
            placeholder='Please share your thoughts about our service!'
            value={comment}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setComment(e.target.value)
            }
            className='mt-3 min-h-28'
          />
          <Button
            className='mt-4 rounded-full'
            disabled={createReview.isPending || !current?.tx || !current?.rid}
            onClick={() => {
              if (!current?.tx || !current?.rid) return;
              const ridNum = Number(current.rid);
              createReview.mutate(
                {
                  transactionId: current.tx,
                  restaurantId: Number.isFinite(ridNum)
                    ? ridNum
                    : (current.rid as string),
                  star: rating,
                  comment: comment.trim(),
                },
                {
                  onSuccess: () => {
                    setReviewOpen(false);
                    setComment('');
                  },
                }
              );
            }}
          >
            {createReview.isPending ? 'Sending…' : 'Send'}
          </Button>
        </DialogContent>
      </Dialog>
      <LogoutDialog
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
        onConfirm={logout}
      />
    </>
  );
}
