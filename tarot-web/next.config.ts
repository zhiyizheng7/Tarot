import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow local network access during dev (desktop/mobile testing)
  allowedDevOrigins: ["192.168.1.114", "localhost", "127.0.0.1"],
};

export default nextConfig;
