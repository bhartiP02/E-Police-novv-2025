import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable static export
  output: "export",

  // Required when exporting, to avoid Next.js image optimization
  images: {
    unoptimized: true,
  },

  // Optional: if you use trailing slash URLs
  // trailingSlash: true,
};

export default nextConfig;
