import type { JSX } from "react";

const ICONS: Record<string, JSX.Element> = {
  logo: <><path d="M12 2 4 7v10l8 5 8-5V7l-8-5Z" /><path d="M12 7v10M8 9.5v5M16 9.5v5" /></>,
  home: <><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /></>,
  send: <path d="M5 19 19 5M9 5h10v10" />,
  receive: <path d="M19 5 5 19M15 19H5V9" />,
  buy: <><rect x="3" y="6" width="18" height="13" rx="2.5" /><path d="M3 10h18" /></>,
  swap: <><path d="M7 4 3 8l4 4" /><path d="M3 8h13" /><path d="m17 20 4-4-4-4" /><path d="M21 16H8" /></>,
  earn: <><circle cx="9" cy="9" r="5" /><path d="M14.4 6.1a5 5 0 1 1 .2 11.8" /></>,
  activity: <path d="M3 12h4l2 6 4-14 2 8h6" />,
  markets: <><path d="M4 19V5" /><path d="M4 19h16" /><path d="m7 15 3-4 3 3 4-6" /></>,
  insights: <><path d="M12 3v9l7 4" /><circle cx="12" cy="12" r="9" /></>,
  chat: <><path d="M5 5h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9l-4 3v-3.2A1 1 0 0 1 4 15V6a1 1 0 0 1 1-1Z" /><path d="M8.5 9.5h7M8.5 12h4.5" /></>,
  users: <><circle cx="9" cy="8" r="3.2" /><path d="M3.5 19a5.5 5.5 0 0 1 11 0" /><path d="M16 5.2a3.2 3.2 0 0 1 0 5.6M20.5 19a5.6 5.6 0 0 0-4-5.1" /></>,
  bell: <><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" /><path d="M10.5 20a2 2 0 0 0 3 0" /></>,
  lock: <><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
  scan: <><path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3" /><path d="M4 12h16" /></>,
  copy: <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h8" /></>,
  shield: <><path d="M12 3 5 6v5c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></>,
  check: <path d="M5 12.5 10 17 19 7" />,
  alert: <><path d="M12 8v5" /><circle cx="12" cy="16.5" r="0.6" /><path d="M10.3 4 3 17a2 2 0 0 0 1.7 3h14.6A2 2 0 0 0 21 17L13.7 4a2 2 0 0 0-3.4 0Z" /></>,
  x: <path d="M6 6 18 18M18 6 6 18" />,
  trash: <path d="M6 7h12M9 7V5h6v2M8 7l1 12h6l1-12" />,
  faceid: <><path d="M4 8V5h3M17 4h3v3M20 16v3h-3M7 20H4v-3" /><path d="M9 10v1.5M15 10v1.5M12 9.5v3l-1 1M9.5 15.5a3.5 3.5 0 0 0 5 0" /></>,
  spark: <path d="M12 3l2.2 6.3L20.5 12l-6.3 2.2L12 20.5l-2.2-6.3L3.5 12l6.3-2.2L12 3Z" />,
  key: <><circle cx="8" cy="15" r="4" /><path d="m11 12 8-8 2 2-2 2 2 2-2.5 2.5L16 12.5 13 15" /></>,
  eyeoff: <><path d="M3 3l18 18" /><path d="M10.6 10.6a3 3 0 0 0 4.2 4.2" /><path d="M9.9 4.2A10.9 10.9 0 0 1 12 4c6.5 0 10 7 10 7a18 18 0 0 1-3 3.6M6.6 6.6A18 18 0 0 0 2 11s3.5 7 10 7a10.8 10.8 0 0 0 3.4-.5" /></>,
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>,
  ban: <><circle cx="12" cy="12" r="9" /><path d="M5.6 5.6 18.4 18.4" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.6 2.6 2.6 15.4 0 18M12 3c-2.6 2.6-2.6 15.4 0 18" /></>,
};

export function Icon({ name, size = 22 }: { name: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[name] ?? null}
    </svg>
  );
}
