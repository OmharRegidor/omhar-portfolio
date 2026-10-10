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

// The Atelier redesign ships as static pages in public/atelier/ (edit them there). These rewrites serve them
// at clean URLs ahead of the old React routes; the old homepage at the original-layout-v1 tag is the rollback.
const atelierPages = [
  { source: "/", destination: "/atelier/index.html" },
  { source: "/gear", destination: "/atelier/gear.html" },
  { source: "/automations", destination: "/atelier/automations.html" },
];

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: false,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  async rewrites() {
    return { beforeFiles: atelierPages, afterFiles: [], fallback: [] };
  },
  async redirects() {
    // Temporary (307) so a rollback isn't stuck in browser caches.
    return [
      { source: "/projects", destination: "/#work", permanent: false },
      { source: "/tech-stack", destination: "/#stack", permanent: false },
      { source: "/automations/cs-live-inbox", destination: "/automations#auto-live-inbox", permanent: false },
      { source: "/automations/daily-sales-pulse", destination: "/automations#auto-sales-pulse", permanent: false },
      { source: "/automations/sop-assistant", destination: "/automations#auto-sop", permanent: false },
    ];
  },
};

export default nextConfig;
