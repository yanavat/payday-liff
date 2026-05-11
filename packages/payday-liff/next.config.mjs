/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@payday/shared', '@payday/payday-api'],
}

export default nextConfig
