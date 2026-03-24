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
  async headers() {
    return [
      {
        // 모든 페이지: bfcache 친화적 캐시 헤더
        source: "/((?!api/).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
      {
        // API 라우트: 짧은 캐시 허용 (bfcache에 영향 없음)
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=300, stale-while-revalidate=600",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
