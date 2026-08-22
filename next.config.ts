import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  compress: true,
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default process.env.NODE_ENV === 'production' ? withSentryConfig(nextConfig, {
  org: "scogestia",
  project: "scogestia-web",
  silent: !process.env.CI,
  widenClientFileUpload: true,
}) : nextConfig;
