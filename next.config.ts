import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  /** מאתחל האזנה ל-Supabase Realtime בעליית השרת */
  experimental: {
    instrumentationHook: true,
  },
};

export default nextConfig;
