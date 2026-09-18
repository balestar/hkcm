import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  images: {
    // Serve public assets as-is — avoids optimizer quirks on local/dev
    unoptimized: true,
  },
};

export default nextConfig;
