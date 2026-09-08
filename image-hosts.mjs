/**
 * Hosts whose images may go through the Next.js image optimiser.
 *
 * This is the single source of truth: `next.config.mjs` turns it into
 * `images.remotePatterns`, and `ItemImage` checks against it to decide whether
 * a given URL can use `next/image` at all.
 *
 * It is deliberately an allow-list rather than `**`. A wildcard would let
 * anyone with admin access point the optimiser at any URL on the internet,
 * making it an open image proxy running on our bandwidth.
 *
 * Images from anywhere else are NOT rejected — `ItemImage` renders them with a
 * plain <img> instead, so pasting a link from any host still works. It just
 * skips AVIF/WebP conversion and resizing.
 *
 * Add a host here to have its images optimised.
 */
export const OPTIMIZED_IMAGE_HOSTS = [
  "images.unsplash.com",
  "plus.unsplash.com",
  "res.cloudinary.com",
  "**.public.blob.vercel-storage.com",
  "lh3.googleusercontent.com",
  "drive.google.com",
  "i.ibb.co",
  "i.imgur.com",
  "raw.githubusercontent.com",
  "**.supabase.co",
  "**.s3.amazonaws.com",
  "cdn.shopify.com",
];

/** Shape next.config.mjs expects. */
export const remoteImagePatterns = OPTIMIZED_IMAGE_HOSTS.map((hostname) => ({
  protocol: "https",
  hostname,
}));

/**
 * Whether `hostname` matches one of the entries above.
 * Supports the leading `**.` wildcard that Next uses for subdomains.
 */
export function isOptimizedHost(hostname) {
  return OPTIMIZED_IMAGE_HOSTS.some((pattern) => {
    if (pattern.startsWith("**.")) {
      const base = pattern.slice(3);
      return hostname === base || hostname.endsWith(`.${base}`);
    }
    return hostname === pattern;
  });
}
