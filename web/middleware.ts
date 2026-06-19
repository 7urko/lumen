import { NextResponse, type NextRequest } from "next/server";

/**
 * Security headers via middleware: a Content-Security-Policy plus a sanctions geo-block.
 *
 * CSP note (important): the app is statically generated (all routes prerendered for
 * speed). A *nonce*-based CSP can't work with static prerendering — the nonce is
 * per-request but static HTML is baked at build time, so Next's own inline hydration
 * scripts would be blocked and the page never becomes interactive. The correct CSP for
 * a static Next app therefore allows `'self' 'unsafe-inline'` for scripts. The strong
 * protections remain: `connect-src` is locked to our RPC/bundler origins (no data can
 * be exfiltrated elsewhere), `frame-ancestors 'none'` (no clickjacking), `object-src
 * 'none'`, and the one third-party script (TradingView) is isolated in a sandboxed
 * iframe. We removed all of our own inline scripts, so the residual risk of
 * `'unsafe-inline'` here is low.
 */

const isDev = process.env.NODE_ENV !== "production";

function rpcOrigins(): string[] {
  const urls = [
    process.env.NEXT_PUBLIC_BASE_RPC ?? "https://mainnet.base.org",
    process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC ?? "https://sepolia.base.org",
    process.env.NEXT_PUBLIC_MAINNET_RPC ?? "https://ethereum-rpc.publicnode.com",
    process.env.NEXT_PUBLIC_BUNDLER_URL ?? "",
  ].filter(Boolean);
  const origins = new Set<string>();
  for (const u of urls) { try { origins.add(new URL(u).origin); } catch { /* ignore */ } }
  return [...origins];
}

function csp(): string {
  const connect = ["'self'", ...rpcOrigins(), ...(isDev ? ["ws:", "http://localhost:*"] : [])].join(" ");
  const script = ["'self'", "'unsafe-inline'", ...(isDev ? ["'unsafe-eval'"] : [])].join(" ");
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    `script-src ${script}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob:",
    `connect-src ${connect}`,
    "frame-src 'self'",            // the sandboxed TradingView srcdoc iframe
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "upgrade-insecure-requests",
  ].join("; ");
}

/**
 * Sanctions geo-block. Baseline list of comprehensively-sanctioned jurisdictions
 * (ISO-3166 alpha-2). Country-level blocking can't catch sub-national regions
 * (e.g. Crimea / Donetsk / Luhansk) — confirm exact scope with counsel and tune.
 * Set GEOBLOCK=off to disable (e.g. local testing).
 */
const GEO_BLOCKED = new Set(["CU", "IR", "KP", "SY"]);
const GEOBLOCK_ON = process.env.GEOBLOCK !== "off";

function blockedCountry(request: NextRequest): string | null {
  if (!GEOBLOCK_ON) return null;
  const cc = (request.headers.get("x-vercel-ip-country") || request.headers.get("cf-ipcountry") || "").toUpperCase();
  return cc && GEO_BLOCKED.has(cc) ? cc : null;
}

function blockedResponse(): NextResponse {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Unavailable</title><style>html,body{height:100%;margin:0;background:#06060c;color:#e7e7ee;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center}main{max-width:30rem;padding:2rem;text-align:center}h1{font-size:1.25rem;margin:0 0 .5rem}p{color:#9aa;line-height:1.5;font-size:.95rem}</style></head><body><main><h1>Lumen isn’t available in your region</h1><p>Access from comprehensively sanctioned jurisdictions is restricted for legal compliance. If you believe this is an error, contact support.</p></main></body></html>`;
  return new NextResponse(html, { status: 451, headers: { "content-type": "text/html; charset=utf-8" } });
}

export function middleware(request: NextRequest) {
  if (blockedCountry(request)) return blockedResponse();
  const response = NextResponse.next();
  response.headers.set("Content-Security-Policy", csp());
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|icons/).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
