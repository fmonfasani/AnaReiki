import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactCompiler: true,
  experimental: {
    proxyClientMaxBodySize: "300mb",
  },
};

export default nextConfig;
