import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: { unoptimized: true, remotePatterns: [{ protocol: "https", hostname: "images.hoy.cr" }] },
};

export default nextConfig;
