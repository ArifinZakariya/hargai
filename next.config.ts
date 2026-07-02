import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        protocol: "https",
        hostname: "shopee.co.id",
      },
      {
        protocol: "https",
        hostname: "tokopedia.com",
      },
      {
        protocol: "https",
        hostname: "images.tokopedia.net",
      },
      {
        protocol: "https",
        hostname: "**.tokopedia-static.net",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
