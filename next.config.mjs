import { remoteImagePatterns } from "./image-hosts.mjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    // Shared with the client so ItemImage knows which URLs can be optimised.
    // Anything not listed still renders — as a plain <img> — see image-hosts.mjs.
    remotePatterns: remoteImagePatterns,
    // Modern formats first; Next falls back automatically for older browsers.
    formats: ["image/avif", "image/webp"],
    // The card grid tops out around 400px wide, so there is no point
    // generating and caching 1920px variants of 166 menu photos.
    imageSizes: [64, 96, 128, 256, 384],
    deviceSizes: [640, 750, 828, 1080, 1200],
    // Menu photos change rarely; cache the optimised output for a month.
    minimumCacheTTL: 2_592_000,
  },
};

export default nextConfig;
