import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { LogoutDialog } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { setServerCartItemId } from '@/features/cart/cartSlice';
import type { RootState } from '@/features/store';
import { useAppDispatch, useAppSelector } from '@/features/store';
import { toast } from 'sonner';
import { apiPost, apiPut } from '@/services/api/axios';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import UserMenuContent from './user-menu-content';

type StoredUser = { name?: string; avatar?: string; avatarUrl?: string };

export default function Navbar() {
  const count = useAppSelector((s: RootState) =>
    s.cart.items.reduce((a, b) => a + b.qty, 0)
  );
  const items = useAppSelector((s: RootState) => s.cart.items);
  const d = useAppDispatch();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<StoredUser | null>(null);
  const nav = useNavigate();
  const location = useLocation();
  const [logoutOpen, setLogoutOpen] = useState(false);

  const searchParams = new URLSearchParams(location.search);
  const mode = (searchParams.get('mode') as 'in' | 'up' | null) ?? null;

  // Track which button is being hovered to allow cross-fade effects
  const [hovering, setHovering] = useState<null | 'in' | 'up'>(null);

  const isHome = location.pathname === '/';
  const qc = useQueryClient();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const t =
      typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    setToken(t);
    try {
      const raw = localStorage.getItem('user');
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          const obj = parsed as Record<string, unknown>;
          const v: StoredUser = {
            name: typeof obj.name === 'string' ? obj.name : undefined,
            avatar: typeof obj.avatar === 'string' ? obj.avatar : undefined,
            avatarUrl:
              typeof (obj as { avatarUrl?: unknown }).avatarUrl === 'string'
                ? ((obj as { avatarUrl?: unknown }).avatarUrl as string)
                : undefined,
          };
          setUser(v);
        }
      }
    } catch (err) {
      if (import.meta.env.DEV)
        console.warn('[navbar] Failed to parse user from storage', err);
    }
  }, []);

  // Keep token in sync after route changes (e.g., after login redirect)
  useEffect(() => {
    const t = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    setToken(t);
  }, [location.pathname, location.search]);

  // Cross-tab token updates (storage event doesn't fire in the same tab)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'token') setToken(e.newValue);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(typeof window !== 'undefined' ? window.scrollY > 4 : false);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    qc.clear();
    nav('/');
  };

  const name = user?.name || 'John Doe';
  const avatarUrl = user?.avatarUrl ?? user?.avatar ?? null;

  const openCart = async () => {
    if (location.pathname.startsWith('/restaurant/')) {
      nav('/cart');
      return;
    }

    const tokenNow =
      typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!tokenNow) {
      nav('/cart');
      return;
    }
    try {
      try {
        window.dispatchEvent(
          new CustomEvent('cart:sync', { detail: { status: 'start' } })
        );
      } catch {
        void 0;
      }
      toast.success('Updating orders...', { className: 'mt-20 sm:mt-0' });
      const ops = items.map(async (it) => {
        const restaurantIdNum = Number(it.restaurantId);
        const menuIdNum = Number(it.id);
        const payload = {
          restaurantId: Number.isFinite(restaurantIdNum)
            ? restaurantIdNum
            : it.restaurantId,
          menuId: Number.isFinite(menuIdNum) ? menuIdNum : it.id,
          quantity: it.qty,
        } as {
          restaurantId: number | string | undefined;
          menuId: number | string;
          quantity: number;
        };

        if (it.serverCartItemId) {
          try {
            await apiPut(`cart/${it.serverCartItemId}`, { quantity: it.qty });
            return;
          } catch (err) {
            if (import.meta.env.DEV)
              console.warn('[navbar] Failed to parse', err);
          }
        }

        if (it.restaurantId) {
          const res = await apiPost<{
            data?: { cartItem?: { id?: number | string } };
          }>('cart', payload);
          const sid = res?.data?.cartItem?.id;
          if (sid)
            d(
              setServerCartItemId({ id: it.id, serverCartItemId: String(sid) })
            );
        }
      });
      await Promise.allSettled(ops);
    } catch (e) {
      if (import.meta.env.DEV) console.error('[navbar] cart sync failed', e);
      toast.error('Some items failed to sync. Check your cart.');
    } finally {
      try {
        window.dispatchEvent(
          new CustomEvent('cart:sync', { detail: { status: 'end' } })
        );
      } catch {
        void 0;
      }
      nav('/cart');
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 backdrop-blur-xs ${
        scrolled
          ? 'bg-white/90 supports-[backdrop-filter]:bg-white/95 border-none border-neutral-200  shadow-[0_0_20px_0_rgba(203,202,202,0.25)]'
          : 'bg-transparent border-transparent '
      }`}
    >
      <div className='max-w-[1200px] px-4 mx-auto sm:px-5 lg:px-0 h-16 sm:h-20 flex items-center justify-between'>
        <Link
          to='/'
          className={`font-semibold text-lg flex items-center gap-[15px] transition-colors ${
            scrolled ? 'text-gray-950' : isHome ? 'text-white' : 'text-gray-950'
          }`}
        >
          <svg
            xmlns='http://www.w3.org/2000/svg'
            className={`size-10 sm:size-[42px] font-semibold text-lg flex items-center gap-[15px] transition-colors ${
              scrolled ? 'text-brand' : isHome ? 'text-white' : 'text-brand'
            }`}
            viewBox='0 0 42 42'
            fill='none'
          >
            <mask
              id='mask0_39423_4673'
              style={{ maskType: 'luminance' }}
              maskUnits='userSpaceOnUse'
              x='0'
              y='0'
              width='42'
              height='42'
            >
              <path d='M42 0H0V42H42V0Z' fill='white' />
            </mask>
            <g mask='url(#mask0_39423_4673)'>
              <path
                fillRule='evenodd'
                clipRule='evenodd'
                d='M22.5 0H19.5V13.2832L14.524 0.967222L11.7425 2.09104L16.8474 14.726L7.21142 5.09009L5.09011 7.21142L14.3257 16.447L2.35706 11.2178L1.15596 13.9669L13.8202 19.5H0V22.5H13.8202L1.15597 28.0331L2.35706 30.7822L14.3257 25.553L5.09011 34.7886L7.21142 36.9098L16.8474 27.274L11.7425 39.909L14.524 41.0327L19.5 28.7169V42H22.5V28.7169L27.476 41.0327L30.2574 39.909L25.1528 27.274L34.7886 36.9098L36.9098 34.7886L27.6742 25.553L39.643 30.7822L40.8439 28.0331L28.1799 22.5H42V19.5H28.1797L40.8439 13.9669L39.643 11.2178L27.6742 16.447L36.9098 7.2114L34.7886 5.09009L25.1528 14.726L30.2574 2.09104L27.476 0.967222L22.5 13.2832V0Z'
                fill='currentColor'
              />
            </g>
          </svg>
          <div className='hidden sm:block text-[32px] font-extrabold leading-[42px]'>
            Foody
          </div>
        </Link>
        <div className='flex items-center gap-4 sm:gap-6'>
          <button
            aria-label='Open cart'
            onClick={openCart}
            className={`relative w-8 h-8 ${token ? 'grid' : 'hidden sm:grid'} place-items-center cursor-pointer ${
              !scrolled && isHome ? 'text-white' : 'text-zinc-900'
            }`}
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 24 27'
              fill='none'
              className='size-7 sm:size-8 cursor-pointer'
            >
              <path
                d='M6.66699 7.66667V6.33333C6.66699 4.91885 7.2289 3.56229 8.22909 2.5621C9.22928 1.5619 10.5858 1 12.0003 1C13.4148 1 14.7714 1.5619 15.7716 2.5621C16.7718 3.56229 17.3337 4.91885 17.3337 6.33333V7.66667'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
              />
              <path
                fillRule='evenodd'
                clipRule='evenodd'
                d='M0.781333 7.11459C-7.94729e-08 7.89592 0 9.15192 0 11.6666V15.6666C0 20.6946 -1.58946e-07 23.2093 1.56267 24.7706C3.12533 26.3319 5.63867 26.3333 10.6667 26.3333H13.3333C18.3613 26.3333 20.876 26.3333 22.4373 24.7706C23.9987 23.2079 24 20.6946 24 15.6666V11.6666C24 9.15192 24 7.89592 23.2187 7.11459C22.4373 6.33325 21.1813 6.33325 18.6667 6.33325H5.33333C2.81867 6.33325 1.56267 6.33325 0.781333 7.11459ZM9.33333 12.9999C9.33333 12.6463 9.19286 12.3072 8.94281 12.0571C8.69276 11.8071 8.35362 11.6666 8 11.6666C7.64638 11.6666 7.30724 11.8071 7.05719 12.0571C6.80714 12.3072 6.66667 12.6463 6.66667 12.9999V15.6666C6.66667 16.0202 6.80714 16.3593 7.05719 16.6094C7.30724 16.8594 7.64638 16.9999 8 16.9999C8.35362 16.9999 8.69276 16.8594 8.94281 16.6094C9.19286 16.3593 9.33333 16.0202 9.33333 15.6666V12.9999ZM17.3333 12.9999C17.3333 12.6463 17.1929 12.3072 16.9428 12.0571C16.6928 11.8071 16.3536 11.6666 16 11.6666C15.6464 11.6666 15.3072 11.8071 15.0572 12.0571C14.8071 12.3072 14.6667 12.6463 14.6667 12.9999V15.6666C14.6667 16.0202 14.8071 16.3593 15.0572 16.6094C15.3072 16.8594 15.6464 16.9999 16 16.9999C16.3536 16.9999 16.6928 16.8594 16.9428 16.6094C17.1929 16.3593 17.3333 16.0202 17.3333 15.6666V12.9999Z'
                fill='currentColor'
              />
            </svg>

            {count > 0 && (
              <span className='absolute -top-1 -right-1.5 min-w-5 h-5 px-0 rounded-full bg-[var(--color-brand,#D22B21)] text-white font-bold text-[12px] leading-5 text-center'>
                {count}
              </span>
            )}
          </button>

          {!token ? (
            <>
              {/* Desktop buttons */}
              <div className='hidden sm:flex items-center gap-2'>
                {(() => {
                  const upActive =
                    (mode === 'up' || !mode) && hovering !== 'in';
                  const inActive = mode === 'in' && hovering !== 'up';

                  const baseBtn =
                    'h-12 w-[163px] rounded-full text-[16px] font-bold border-2 transition-colors';
                  const inactive = `bg-transparent border-gray-300 cursor-pointer ${
                    !scrolled && isHome ? 'text-white' : 'text-gray-950'
                  }`;

                  return (
                    <>
                      <Button
                        className={`${baseBtn} ${
                          inActive
                            ? 'bg-white text-gray-950 border-gray-300'
                            : inactive
                        }`}
                        variant='outline'
                        asChild
                        aria-label='Sign in'
                        onMouseEnter={() => setHovering('in')}
                        onMouseLeave={() => setHovering(null)}
                      >
                        <Link to='/auth?mode=in'>Sign In</Link>
                      </Button>

                      <Button
                        className={`${baseBtn} ${
                          upActive
                            ? 'bg-white text-gray-950 border-gray-300'
                            : inactive
                        }`}
                        variant='outline'
                        asChild
                        aria-label='Sign up'
                        onMouseEnter={() => setHovering('up')}
                        onMouseLeave={() => setHovering(null)}
                      >
                        <Link to='/auth?mode=up'>Sign Up</Link>
                      </Button>
                    </>
                  );
                })()}
              </div>

              {/* Mobile: smaller Sign In / Sign Up buttons */}
              <div className='flex sm:hidden items-center gap-2'>
                {(() => {
                  const upActive = (mode === 'up' || !mode) && hovering !== 'in';
                  const inActive = mode === 'in' && hovering !== 'up';
                  const baseBtn = 'h-9 w-[130px] rounded-full text-[14px] font-bold border-2';
                  const inactive = `bg-transparent border-gray-300 cursor-pointer ${
                    !scrolled && isHome ? 'text-white' : 'text-gray-950'
                  }`;
                  return (
                    <>
                      <Button
                        className={`${baseBtn} ${
                          inActive
                            ? 'bg-white text-gray-950 border-gray-300'
                            : inactive
                        }`}
                        variant='outline'
                        asChild
                        aria-label='Sign in'
                        onMouseEnter={() => setHovering('in')}
                        onMouseLeave={() => setHovering(null)}
                      >
                        <Link to='/auth?mode=in'>Sign In</Link>
                      </Button>
                      <Button
                        className={`${baseBtn} ${
                          upActive
                            ? 'bg-white text-gray-950 border-gray-300'
                            : inactive
                        }`}
                        variant='outline'
                        asChild
                        aria-label='Sign up'
                        onMouseEnter={() => setHovering('up')}
                        onMouseLeave={() => setHovering(null)}
                      >
                        <Link to='/auth?mode=up'>Sign Up</Link>
                      </Button>
                    </>
                  );
                })()}
              </div>
            </>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  aria-label='Open user menu'
                  className='flex items-center gap-4 overflow-visible cursor-pointer'
                >
                  <Avatar className='size-10 sm:size-12 shrink-0 aspect-square bg-transparent border-none p-0'>
                    <AvatarImage
                      src={avatarUrl}
                      alt={name}
                      className='object-contain object-center cursor-pointer'
                    />
                  </Avatar>
                  <span
                    className={`hidden sm:inline font-semibold text-lg items-center gap-2 transition-colors ${
                      scrolled
                        ? 'text-gray-950'
                        : isHome
                        ? 'text-white'
                        : 'text-gray-950'
                    }`}
                  >
                    {name}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <UserMenuContent
                name={name}
                avatarUrl={avatarUrl}
                onClickProfile={() => nav('/profile')}
                onClickAddress={() => {
                  /* placeholder route */
                }}
                onClickOrders={() => nav('/orders')}
                onClickLogout={() => setLogoutOpen(true)}
              />
            </DropdownMenu>
          )}
        </div>
      </div>
      <LogoutDialog
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
        onConfirm={logout}
      />
    </header>
  );
}
