import type { NextConfig } from "next";

// `'unsafe-inline'` on script-src is required for next-themes' pre-paint script
// (prevents light-mode flash on dark-OS users on first visit). Replace with a
// nonce strategy in v1.1 if tightening is needed. Do NOT remove without that.
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // NOTE: do NOT add `preload` until a custom domain is attached and verified on hstspreload.org.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  {
    key: "Content-Security-Policy",
    value:
      "default-src 'self'; script-src 'self' 'unsafe-inline'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; font-src 'self' data:; frame-ancestors 'none'",
  },
];

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: false,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
