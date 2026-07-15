import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable the instrumentation hook for CoCMS auto-sync on boot
  experimental: {
    instrumentationHook: true,
  },
};

export default nextConfig;
