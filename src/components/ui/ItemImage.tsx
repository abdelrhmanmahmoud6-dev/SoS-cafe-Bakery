"use client";

import { useState } from "react";
import Image from "next/image";
import type { IconKey } from "@/lib/menu-data";
import { cn } from "@/lib/utils";
import { CategoryIcon } from "./CategoryIcon";

/**
 * Product photo, served through next/image.
 *
 * Going through the optimiser gets AVIF/WebP, correctly sized variants and
 * lazy loading for free — which matters a lot here, because the grid can show
 * dozens of photos at once. The hosts it may load from are allow-listed in
 * next.config.mjs so the optimiser can't be pointed at arbitrary URLs.
 *
 * Three states so a slow photo never leaves a hole in the grid:
 *   loading → CSS pulse over the brand gradient (no JS, no layout shift)
 *   loaded  → the photo, faded in
 *   missing / failed → the category icon on a warm gradient
 */
export function ItemImage({
  src,
  alt,
  icon,
  className,
  iconClassName = "size-8",
  sizes = "(max-width: 420px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw",
  priority = false,
}: {
  src: string | null | undefined;
  alt: string;
  icon: IconKey;
  className?: string;
  iconClassName?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-gradient-to-br from-ink-800 to-ink-900",
        className
      )}
    >
      {showImage ? (
        <>
          {/* Skeleton sits underneath until the photo decodes. A plain CSS
              pulse rather than a JS animation, so 100+ of these cost nothing. */}
          {!loaded && (
            <div
              aria-hidden
              className="absolute inset-0 animate-pulse bg-gradient-to-br from-ink-700 to-ink-800"
            />
          )}

          <Image
            src={src as string}
            alt={alt}
            fill
            sizes={sizes}
            priority={priority}
            // Everything below the first row is off-screen on load.
            loading={priority ? undefined : "lazy"}
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            className={cn(
              "object-cover transition-opacity duration-500",
              loaded ? "opacity-100" : "opacity-0"
            )}
          />
        </>
      ) : (
        <div
          aria-hidden
          className="flex size-full items-center justify-center bg-[radial-gradient(120%_120%_at_50%_0%,rgb(254_229_0/0.14),transparent_70%)] text-gold-500/70"
        >
          <CategoryIcon name={icon} className={iconClassName} strokeWidth={1.5} />
        </div>
      )}
    </div>
  );
}
