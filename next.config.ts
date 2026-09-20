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

// Enable Cloudflare bindings in `next dev` when the adapter is installed.
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { initOpenNextCloudflareForDev } = require("@opennextjs/cloudflare");
  initOpenNextCloudflareForDev();
} catch {
  // Optional during local installs that haven't pulled OpenNext yet.
}
