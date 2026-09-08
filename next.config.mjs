/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    // Hosts the menu manager is allowed to load photos from. Deliberately an
    // allow-list rather than a wildcard: `**` would let anyone with admin
    // access point the optimiser at any URL on the internet, turning it into an
    // open image proxy that we pay the bandwidth for.
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "**.public.blob.vercel-storage.com" },
    ],
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
