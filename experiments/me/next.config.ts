import type { NextConfig } from "next";
const config: NextConfig = {
  output: "export",
  basePath: "/me",
  images: { unoptimized: true },
  reactStrictMode: true,
  devIndicators: false,
};
export default config;
