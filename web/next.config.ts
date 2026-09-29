import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@jevo/protocol-types"],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
