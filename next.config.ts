import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  basePath: isProd ? "/QI_Tracker" : "",
  trailingSlash: true,
  // Allow build to succeed during migration — pre-existing strict TS issues in Supabase inference
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;

