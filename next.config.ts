import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  trailingSlash: false,
  experimental: {
    optimizeCss: false,
    optimizePackageImports: [
      "react", "react-dom"
    ]
  },
  headers: async () => {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=60, s-maxage=300, stale-while-revalidate=120" }
        ]
      }
    ];
  }
};

export default nextConfig;
