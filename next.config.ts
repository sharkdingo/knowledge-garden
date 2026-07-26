import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Sites serves versioned local assets at the edge. This avoids depending on
    // an optional image-transform binding for the site's authored imagery.
    unoptimized: true,
  },
};

export default nextConfig;
