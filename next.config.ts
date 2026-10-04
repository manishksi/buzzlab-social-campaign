import type { NextConfig } from "next";

// Static export: `npm run build` writes a self-contained site to /out
// that can be hosted anywhere (Vercel, Netlify, S3, a USB stick).
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default nextConfig;
