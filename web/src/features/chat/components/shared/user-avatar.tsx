"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { useImageLightbox } from "@/components/ui/image-lightbox";
import type { UserAvatarProps } from "@/type";

export function UserAvatar({
  src,
  name,
  size = "md",
  className,
  shape = "rounded",
  showStatus = false,
  status = "offline",
  previewable = false,
}: UserAvatarProps) {
  const { openLightbox } = useImageLightbox();
  const canPreview = previewable && !!src;
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-14 h-14 text-lg",
  };

  const statusDotSizes = {
    sm: "w-2 h-2 ring-1",
    md: "w-2.5 h-2.5 ring-2",
    lg: "w-3 h-3 ring-2",
    xl: "w-3.5 h-3.5 ring-2",
  };

  const shapeClass = shape === "circle" ? "rounded-full" : "rounded-xl";

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className={cn("relative shrink-0 select-none", sizeClasses[size], className)}>
      <div
        role={canPreview ? "button" : undefined}
        tabIndex={canPreview ? 0 : undefined}
        aria-label={canPreview ? `Xem ảnh của ${name}` : undefined}
        onClick={canPreview ? () => openLightbox([{ src: src!, alt: name }]) : undefined}
        onKeyDown={
          canPreview
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openLightbox([{ src: src!, alt: name }]);
                }
              }
            : undefined
        }
        className={cn(
          "w-full h-full overflow-hidden flex items-center justify-center font-medium bg-muted text-foreground/80",
          shapeClass,
          canPreview &&
            "cursor-zoom-in transition-[filter,transform] hover:brightness-90 focus-visible:outline-2 focus-visible:outline-primary"
        )}
      >
        {src ? (
          <Image
            src={src}
            alt={name}
            width={64}
            height={64}
            className="w-full h-full object-cover"
            unoptimized
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>

      {showStatus && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full ring-white",
            statusDotSizes[size],
            status === "online" ? "bg-emerald-500" : "bg-zinc-300"
          )}
        />
      )}
    </div>
  );
}
