import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@jevo/protocol-types"],
};

export default nextConfig;
