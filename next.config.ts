import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configure Next.js Image Optimization domains
  images: {
    domains: ["lh3.googleusercontent.com"], // Allow Google profile images
  },

};

export default nextConfig;
