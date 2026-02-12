/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  // Set the base path to match your repository name for GitHub Pages
  basePath: '/QI_Tracker',
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
