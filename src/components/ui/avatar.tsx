import * as React from "react";
import { cn } from "@/lib/utils";

export function Avatar({ className, children }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center overflow-hidden rounded-full bg-zinc-200 text-zinc-600",
        className
      )}
    >
      {children}
    </div>
  );
}

export function AvatarImage({
  src,
  alt,
  className,
}: { src?: string | null; alt?: string; className?: string }) {
  const fallback = "/avatar1.svg";
  const finalSrc = src && String(src).trim().length > 0 ? src : fallback;
  return (
    <img
      src={finalSrc}
      alt={alt}
      className={cn("h-full w-full object-cover", className)}
      referrerPolicy="no-referrer"
      onError={(e) => {
        const img = e.currentTarget as HTMLImageElement;
        if (!img.src.endsWith(fallback)) {
          img.onerror = null;
          img.src = fallback;
        }
      }}
    />
  );
}

export function AvatarFallback({
  children,
  className,
}: React.ComponentProps<"div">) {
  return <div className={cn("text-sm font-medium", className)}>{children}</div>;
}
