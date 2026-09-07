"use client";

import { useState } from "react";
import type { IconKey } from "@/lib/menu-data";
import { cn } from "@/lib/utils";
import { CategoryIcon } from "./CategoryIcon";

/**
 * Product photo with a branded fallback.
 *
 * Uses a plain <img> rather than next/image on purpose: image URLs are typed in
 * by an admin and can point anywhere, and routing arbitrary third-party URLs
 * through Next's optimiser turns this app into an open image proxy. A plain tag
 * fetches straight from the source with no server-side surface.
 *
 * A broken or missing URL falls back to the category icon on a warm gradient,
 * so a card never renders as an empty grey box.
 */
export function ItemImage({
  src,
  alt,
  icon,
  className,
  iconClassName = "size-8",
}: {
  src: string | null | undefined;
  alt: string;
  icon: IconKey;
  className?: string;
  iconClassName?: string;
}) {
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
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src as string}
          alt={alt}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
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
