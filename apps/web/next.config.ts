import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  transpilePackages: [
    "@audio-suite/shared-types",
    "@audio-suite/shared-ui",
    "@audio-suite/shared-worker-runtime",
  ],
};

export default nextConfig;
