import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow preview hosts for Arena / E2B
  allowedDevOrigins: ["*.e2b.app", "*.e2b.dev", "*.arena.ai"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "ALLOWALL",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
