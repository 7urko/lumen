"use client";
import { useEffect } from "react";

/** Background async failures (e.g. a flaky public RPC during polling) should not
 *  crash the app or pop the dev error overlay — user-facing actions handle their
 *  own errors in-UI. We log suppressed rejections so they're never invisible. */
export function RejectionGuard() {
  useEffect(() => {
    const onRej = (e: PromiseRejectionEvent) => {
      const r = e.reason as unknown;
      const msg = r instanceof Error ? r.message : typeof r === "string" ? r : (r as { type?: string })?.type ?? "unknown";
      console.warn("[Lumen] background rejection suppressed:", msg, r);
      e.preventDefault();
    };
    const onErr = (e: ErrorEvent) => {
      // network resource errors (image/script/font) — non-fatal
      if (e.message?.includes("ResizeObserver")) e.preventDefault();
    };
    window.addEventListener("unhandledrejection", onRej);
    window.addEventListener("error", onErr);
    return () => { window.removeEventListener("unhandledrejection", onRej); window.removeEventListener("error", onErr); };
  }, []);
  return null;
}
