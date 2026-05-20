import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  /** instrumentationHook no longer needed — enabled by default in Next.js 15 */
};

export default nextConfig;
