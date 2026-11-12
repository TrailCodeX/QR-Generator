import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export: `npm run build` writes a plain HTML/JS site to `out/`,
  // which any static host can serve.
  output: "export",
};

export default nextConfig;
