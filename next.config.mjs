/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  async rewrites() {
    return { beforeFiles: [{ source: "/me", destination: "/me/index.html" }] };
  },
  async headers() {
    return [
      {
        source: "/music/sw.js",
        headers: [
          { key: "Service-Worker-Allowed", value: "/music" },
          { key: "Cache-Control", value: "no-cache" },
        ],
      },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), geolocation=(), microphone=(self)",
          },
          {
            key: "Content-Security-Policy",
            value:
              "base-uri 'self'; object-src 'none'; frame-ancestors 'none'; frame-src https://www.youtube-nocookie.com https://open.spotify.com",
          },
        ],
      },
    ];
  },
};
export default nextConfig;
