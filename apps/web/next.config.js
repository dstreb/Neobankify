/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Standalone output for containerized deployments
  output: 'standalone',
};

module.exports = nextConfig;
