/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    // Prisma и ioredis тянут нативные бинарники — они не должны попадать
    // в бандл серверных компонентов.
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs', 'ioredis'],
  },
};

export default nextConfig;
