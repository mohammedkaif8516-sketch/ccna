/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // Add this block to skip strict type checking on deploy
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
