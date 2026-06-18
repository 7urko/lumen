import { NextResponse, type NextRequest } from "next/server";

/**
 * Nonce-based Content-Security-Policy (security review M5 / H1 follow-up).
 *
 * Each request gets a fresh nonce. `script-src` is `'self' 'nonce-…' 'strict-dynamic'`
 * — NO `'unsafe-inline'`, so an injected <script> can't run even if an XSS slips in.
 * The only third-party script (TradingView) now lives inside a sandboxed iframe with
 * its own CSP (see app/markets/page.tsx), so the main document needs no third-party
 * script hosts at all. `connect-src` is locked to our RPC/bundler origins, so nothing
 * can exfiltrate the (encrypted) vault elsewhere. `frame-ancestors 'none'` blocks
 * clickjacking. Setting the CSP on the request headers lets Next.js auto-apply the
 * nonce to its own framework scripts.
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

function makeNonce(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  let bin = "";
  for (const b of arr) bin += String.fromCharCode(b);
  return btoa(bin);
}

/**
 * Sanctions geo-block. Baseline list of comprehensively-sanctioned jurisdictions
 * (ISO-3166 alpha-2). Country-level blocking can't catch sub-national regions
 * (e.g. Crimea / Donetsk / Luhansk) — confirm the exact scope with counsel and
 * tune this list. Set GEOBLOCK=off to disable (e.g. for local testing).
 */
const GEO_BLOCKED = new Set(["CU", "IR", "KP", "SY"]);
const GEOBLOCK_ON = process.env.GEOBLOCK !== "off";

function blockedCountry(request: NextRequest): string | null {
  if (!GEOBLOCK_ON) return null;
  const cc = (request.headers.get("x-vercel-ip-country") || request.headers.get("cf-ipcountry") || "").toUpperCase();
  return cc && GEO_BLOCKED.has(cc) ? cc : null;
}

function blockedResponse(cc: string): NextResponse {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Unavailable</title><style>html,body{height:100%;margin:0;background:#06060c;color:#e7e7ee;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center}main{max-width:30rem;padding:2rem;text-align:center}h1{font-size:1.25rem;margin:0 0 .5rem}p{color:#9aa;line-height:1.5;font-size:.95rem}</style></head><body><main><h1>Lumen isn’t available in your region</h1><p>Access from comprehensively sanctioned jurisdictions is restricted for legal compliance. If you believe this is an error, contact support.</p></main></body></html>`;
  return new NextResponse(html, { status: 451, headers: { "content-type": "text/html; charset=utf-8" } });
}

export function middleware(request: NextRequest) {
  const cc = blockedCountry(request);
  if (cc) return blockedResponse(cc);

  const nonce = makeNonce();

  const connect = ["'self'", ...rpcOrigins(), ...(isDev ? ["ws:", "http://localhost:*"] : [])].join(" ");
  const script = ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'", ...(isDev ? ["'unsafe-eval'"] : [])].join(" ");

  const csp = [
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

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  // Apply to pages; skip Next static assets, the service worker, manifest and icons.
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
