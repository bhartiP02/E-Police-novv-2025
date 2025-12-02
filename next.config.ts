import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable static export
  output: "export",
  reactStrictMode:false,
  // Required when exporting, to avoid Next.js image optimization
  images: {
    unoptimized: true,
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    /** ⚠️⚠️⚠️⚠️⚠️⚠️⚠️ Comment this before uploading to production */
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },

  // Optional: if you use trailing slash URLs
  // trailingSlash: true,
};

export default nextConfig;
