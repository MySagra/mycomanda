import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server in .next/standalone, used by the Docker image.
  output: "standalone",
  allowedDevOrigins: ['192.168.1.10']
};

export default nextConfig;
