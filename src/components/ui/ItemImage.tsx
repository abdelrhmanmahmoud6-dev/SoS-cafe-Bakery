"use client";

import { useState } from "react";
import Image from "next/image";
// Shared with next.config.mjs so the allow-list can never drift.
import { isOptimizedHost } from "../../../image-hosts.mjs";
import type { IconKey } from "@/lib/menu-data";
import { cn, isUsableImageUrl } from "@/lib/utils";
import { CategoryIcon } from "./CategoryIcon";

/* ============================================================================
   Product photo.

   Three rendering paths, picked per URL:

     1. Allow-listed host  -> next/image, so we get AVIF/WebP, sized variants
                              and lazy loading.
     2. Any other host     -> a plain <img>. next/image REFUSES any host that is
                              not in remotePatterns, and an admin can paste a
                              link from anywhere; failing those would be worse
                              than serving them unoptimised.
     3. Missing / invalid / broken -> the category icon on a warm gradient.

   Path 2 exists because of a real regression: switching the grid to next/image
   with a four-host allow-list silently stopped rendering every image hosted
   anywhere else.
   ========================================================================== */

function canOptimize(src: string): boolean {
  if (src.startsWith("/")) return true; // served by us
  try {
    return isOptimizedHost(new URL(src).hostname);
  } catch {
    return false;
  }
}

export function ItemImage({
  src,
  alt,
  icon,
  className,
  iconClassName = "size-8",
  sizes = "(max-width: 420px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw",
  priority = false,
  as: Tag = "div",
}: {
  src: string | null | undefined;
  alt: string;
  icon: IconKey;
  className?: string;
  iconClassName?: string;
  sizes?: string;
  priority?: boolean;
  /**
   * Wrapper element. The category rail nests this inside a <button>, which may
   * only contain phrasing content, so it renders as a <span> there.
   */
  as?: "div" | "span";
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const url = typeof src === "string" ? src.trim() : "";
  const usable = url !== "" && isUsableImageUrl(url);
  const showImage = usable && !failed;
  const optimized = showImage && canOptimize(url);

  return (
    <Tag
      className={cn(
        "relative block overflow-hidden bg-gradient-to-br from-sand-200 to-sand-100",
        className
      )}
    >
      {showImage ? (
        <>
          {/* Skeleton underneath until the photo decodes. Plain CSS, so a
              gridful of these costs nothing on the main thread. */}
          {!loaded && (
            <span
              aria-hidden
              className="absolute inset-0 animate-pulse bg-gradient-to-br from-sand-300 to-sand-200"
            />
          )}

          {optimized ? (
            <Image
              src={url}
              alt={alt}
              fill
              sizes={sizes}
              priority={priority}
              loading={priority ? undefined : "lazy"}
              onLoad={() => setLoaded(true)}
              onError={() => setFailed(true)}
              className={cn(
                "object-cover transition-opacity duration-500",
                loaded ? "opacity-100" : "opacity-0"
              )}
            />
          ) : (
            /* Host is not allow-listed, so this bypasses the Next optimiser and
               downloads the publisher's original file at whatever size they
               host it — often 1600px+ for a card that renders around 280px.
               `sizes` cannot help here: without a `srcset` there is nothing for
               the browser to choose between.

               What is left is to keep it off the critical path — lazy, decoded
               off the main thread, and explicitly deprioritised so it never
               competes with the images that are above the fold.

               The real fix is to stop serving third-party originals at all;
               see the note in image-hosts.mjs. */
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt={alt}
              loading={priority ? "eager" : "lazy"}
              fetchPriority={priority ? "high" : "low"}
              decoding="async"
              onLoad={() => setLoaded(true)}
              onError={() => setFailed(true)}
              className={cn(
                "absolute inset-0 size-full object-cover transition-opacity duration-500",
                loaded ? "opacity-100" : "opacity-0"
              )}
            />
          )}
        </>
      ) : (
        <span
          aria-hidden
          className="flex size-full items-center justify-center bg-[radial-gradient(120%_120%_at_50%_0%,rgb(202_138_4/0.16),transparent_70%)] text-gold-800/70"
        >
          <CategoryIcon name={icon} className={iconClassName} strokeWidth={1.5} />
        </span>
      )}
    </Tag>
  );
}
