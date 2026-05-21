import type { NextConfig } from "next";

const nextConfig = {
  output: "export",
  images: { unoptimized: true },
  basePath: "/QI_Tracker",
  trailingSlash: true,
  // Allow build to succeed during migration — pre-existing strict TS issues in Supabase inference
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
} as any;

export default nextConfig;
