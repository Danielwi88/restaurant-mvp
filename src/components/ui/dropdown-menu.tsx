import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type Ctx = {
  open: boolean;
  setOpen: (v: boolean) => void;
  triggerRef: React.RefObject<HTMLElement | null>;
};

const MenuCtx = React.createContext<Ctx | null>(null);

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLElement | null>(null);
  const value = React.useMemo(() => ({ open, setOpen, triggerRef }), [open]);
  return <MenuCtx.Provider value={value}>{children}</MenuCtx.Provider>;
}

export function DropdownMenuTrigger({ children, asChild }: { children: React.ReactElement; asChild?: boolean }) {
  const ctx = React.useContext(MenuCtx)!;
  const props = {
    ref: ctx.triggerRef as unknown as React.Ref<unknown>,
    onClick: (e: React.MouseEvent) => {
      e.preventDefault();
      ctx.setOpen(!ctx.open);
    },
  };
  return asChild ? React.cloneElement(children, props) : (
    <button {...(props as unknown as React.ButtonHTMLAttributes<HTMLButtonElement>)}>{children}</button>
  );
}

export function DropdownMenuContent({
  children,
  className,
  sideOffset = 8,
  withOverlay = false,
  overlayClassName,
}: {
  children: React.ReactNode;
  className?: string;
  sideOffset?: number;
  withOverlay?: boolean;
  overlayClassName?: string;
}) {
  const ctx = React.useContext(MenuCtx)!;
  const [pos, setPos] = React.useState<{ top: number; left: number } | null>(null);

  React.useLayoutEffect(() => {
    if (ctx.open && ctx.triggerRef.current) {
      const r = ctx.triggerRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + sideOffset + window.scrollY, left: r.right + window.scrollX });
    }
  }, [ctx.open, sideOffset, ctx.triggerRef]);

  React.useEffect(() => {
    function handle(e: MouseEvent) {
      const trg = ctx.triggerRef.current;
      if (!trg) return ctx.setOpen(false);
      const t = e.target as Node;
      if (trg.contains(t)) return; // click on trigger already toggles
      ctx.setOpen(false);
    }
    if (ctx.open) document.addEventListener("click", handle);
    return () => document.removeEventListener("click", handle);
  }, [ctx]);

  if (!ctx.open || !pos) return null;
  return createPortal(
    <>
      {withOverlay && (
        <div
          className={cn(
            "fixed inset-0 bg-black/50 z-40",
            overlayClassName
          )}
          aria-hidden
          onClick={() => ctx.setOpen(false)}
        />
      )}
      <div
        className={cn(
          "z-50 min-w-56 rounded-xl border bg-white p-2 shadow-2xl w-[197px]",
          "animate-in fade-in-0 zoom-in-95",
          className
        )}
        style={{ position: "absolute", top: pos.top, left: pos.left, transform: "translateX(-100%)" }}
        role="menu"
      >
        {children}
      </div>
    </>,
    document.body
  );
}

export function DropdownMenuLabel({ className, children }: React.ComponentProps<"div">) {
  return <div className={cn("px-2 py-2 text-sm font-semibold", className)}>{children}</div>;
}

export function DropdownMenuSeparator({ className }: React.ComponentProps<"div">) {
  return <div className={cn("my-1 h-px bg-neutral-200", className)} />;
}

export function DropdownMenuItem({ className, children, onSelect }: { className?: string; children: React.ReactNode; onSelect?: () => void }) {
  return (
    <button
      className={cn(
        "w-full select-none items-center rounded-lg px-3 py-2 text-left text-sm text-gray-800",
        "hover:bg-neutral-100",
        className
      )}
      onClick={onSelect}
      role="menuitem"
    >
      {children}
    </button>
  );
}
