// src/components/Navbar.tsx
import { Link, useNavigate } from "react-router-dom";
import { useAppSelector } from "@/features/store";
import { Button } from "@/components/ui/button";
import type { RootState } from "@/features/store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";
import { LogOutIcon, MapPinIcon, ReceiptIcon } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function Navbar() {
  const count = useAppSelector((s: RootState) => s.cart.items.reduce((a, b) => a + b.qty, 0));
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<{ name?: string; avatar?: string } | null>(null);
  const nav = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    const t = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    setToken(t);
    try {
      const raw = localStorage.getItem('user');
      if (raw) setUser(JSON.parse(raw));
    } catch {}
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
  const avatarUrl = (user as any)?.avatarUrl || (user as any)?.avatar || null;

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="font-semibold text-lg flex items-center gap-2">
          <span className="inline-block size-6 rounded-full bg-[var(--color-brand,#D22B21)]" /> Foody
        </Link>
        <div className="flex items-center gap-3">
          <Button variant="outline" asChild aria-label="Open cart">
            <Link to="/cart" className="relative">
              Cart
              {count>0 && (
                <span className="ml-2 rounded-full bg-[var(--color-brand,#D22B21)] text-white px-2 text-xs">{count}</span>
              )}
            </Link>
          </Button>

          {!token ? (
            <div className="flex items-center gap-2">
              <Button variant="outline" asChild aria-label="Sign in">
                <Link to="/auth?mode=in">Sign In</Link>
              </Button>
              <Button asChild aria-label="Sign up">
                <Link to="/auth?mode=up">Sign Up</Link>
              </Button>
            </div>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button aria-label="Open user menu" className="flex items-center gap-2">
                  <Avatar className="size-9">
                    <AvatarImage src={avatarUrl} alt={name} />
                    <AvatarFallback className="size-9 grid place-items-center">
                      {name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-sm font-medium text-zinc-800">{name}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="rounded-2xl">
                <DropdownMenuLabel>
                  <div className="flex items-center gap-2">
                    <Avatar className="size-8">
                      <AvatarImage src={avatarUrl} alt={name} />
                      <AvatarFallback className="size-8 grid place-items-center text-xs">
                        {name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="font-semibold">{name}</div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => { /* placeholder route */ }}>
                  <div className="flex items-center gap-3">
                    <MapPinIcon className="size-4" />
                    <span>Delivery Address</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => nav('/orders')}>
                  <div className="flex items-center gap-3">
                    <ReceiptIcon className="size-4" />
                    <span>My Orders</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={logout}>
                  <div className="flex items-center gap-3 text-red-600">
                    <LogOutIcon className="size-4" />
                    <span>Logout</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
