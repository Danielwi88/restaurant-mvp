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
  if (!src) return null;
  return (
    <img
      src={src}
      alt={alt}
      className={cn("h-full w-full object-cover", className)}
      referrerPolicy="no-referrer"
    />
  );
}

export function AvatarFallback({
  children,
  className,
}: React.ComponentProps<"div">) {
  return <div className={cn("text-sm font-medium", className)}>{children}</div>;
}

