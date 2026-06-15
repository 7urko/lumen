export interface Accent { name: string; accent: string; accent2: string; grad: string }
export const ACCENTS: Accent[] = [
  { name: "Iris", accent: "#6e63ff", accent2: "#22d3ee", grad: "linear-gradient(135deg,#6e63ff 0%,#8b5cff 55%,#b14bff 100%)" },
  { name: "Cyan", accent: "#22d3ee", accent2: "#6e63ff", grad: "linear-gradient(135deg,#22d3ee,#3b82f6 60%,#6e63ff)" },
  { name: "Emerald", accent: "#34e3a4", accent2: "#22d3ee", grad: "linear-gradient(135deg,#34e3a4,#22d3ee)" },
  { name: "Magenta", accent: "#ff5cc8", accent2: "#8b5cff", grad: "linear-gradient(135deg,#ff5cc8,#b14bff 60%,#8b5cff)" },
];
const KEY = "lumen.accent";
export function getAccentName(): string {
  if (typeof window === "undefined") return "Iris";
  return localStorage.getItem(KEY) ?? "Iris";
}
export function applyAccent(name: string): void {
  if (typeof document === "undefined") return;
  const a = ACCENTS.find((x) => x.name === name) ?? ACCENTS[0]!;
  const r = document.documentElement.style;
  r.setProperty("--accent", a.accent);
  r.setProperty("--accent-2", a.accent2);
  r.setProperty("--grad", a.grad);
  r.setProperty("--grad-cyan", `linear-gradient(135deg, ${a.accent}, ${a.accent2})`);
  localStorage.setItem(KEY, name);
}
