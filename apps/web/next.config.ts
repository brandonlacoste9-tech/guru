import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@floguru/guru-core"],
};

export default nextConfig;
