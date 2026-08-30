import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  basePath: isProd ? "/QI_Tracker" : "",
  trailingSlash: true,
  // Type errors now fail the build. The escape hatch was added for pre-existing
  // Supabase inference issues, but the repo currently has zero type errors, and
  // the hatch was actively hiding real bugs: a null user dereference introduced
  // with the dev auth bypass, and demo data using a field name nothing reads.
  // If this ever needs re-enabling, fix the error instead.
  typescript: { ignoreBuildErrors: false },
};

export default nextConfig;

