import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true, // ✅ Vercel 빌드 시 ESLint 무시
  },
};

export default nextConfig;

