import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "web.poecdn.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
