import type { NextConfig } from "next";

/**
 * Static security headers. The Content-Security-Policy is set per-request (with a
 * fresh nonce) in `middleware.ts` — keeping it there avoids a conflicting second CSP
 * and lets Next.js apply the nonce to its framework scripts. These headers are the
 * ones that don't need a nonce and are safe to set statically.
 */
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  // Allow the camera for the QR scanner; deny everything else by default.
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@lumen/core"],
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
