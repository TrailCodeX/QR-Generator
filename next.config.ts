import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produces a minimal self-contained server for the Cloud Run Docker image.
  output: "standalone",
  // Keep the GCP SDK out of the bundle; it is only ever loaded server-side.
  serverExternalPackages: ["@google-cloud/storage"],
};

export default nextConfig;
