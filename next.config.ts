import type { NextConfig } from "next";

function getAllowedDevOrigins() {
  return ["192.168.8.155"];
}

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  allowedDevOrigins: getAllowedDevOrigins(),
};

export default nextConfig;
