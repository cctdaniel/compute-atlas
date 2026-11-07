import type { CSSProperties } from "react";

const paths = {
  arrow: "M5 12h14m-6-6 6 6-6 6",
  chevron: "m9 5 7 7-7 7",
  search: "m21 21-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
  book: "M12 5c-4-3-8-2-10-1v15c3-2 7-1 10 1m0-15c4-3 8-2 10-1v15c-3-2-7-1-10 1V5",
  bookmark: "M6 3h12v18l-6-4-6 4V3Z",
  network: "M12 4 4 12l8 8 8-8-8-8ZM12 4v16M4 12h16",
  branches: "M6 3v12a4 4 0 0 0 4 4h8M6 8h8a4 4 0 0 0 4-4M3 3h6m6 16h6m-6-15h6",
  layers: "m12 3 10 5-10 5L2 8l10-5Zm-10 9 10 5 10-5M2 16l10 5 10-5",
  globe: "M2 12h20M12 2c6 6 6 14 0 20-6-6-6-14 0-20Zm10 10a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
  database: "M3 6v12c0 5 18 5 18 0V6M3 6c0 5 18 5 18 0S3 1 3 6Zm0 6c0 5 18 5 18 0",
  shield: "m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6l9-4Zm-4 10 3 3 5-6",
  sun: "M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
  moon: "M21 13a9 9 0 0 1-10-10A9 9 0 1 0 21 13Z",
  monitor: "M3 3h18v13H3V3Zm9 13v5m-5 0h10",
  menu: "M4 6h16M4 12h16M4 18h16",
  close: "m6 6 12 12M6 18 18 6",
  check: "m5 12 4 4L19 6",
  clock: "M12 7v5l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0",
  play: "m8 4 12 8-12 8V4Z",
  pause: "M8 5v14M16 5v14",
  back: "M5 5v14m14-14L7 12l12 7V5Z",
  step: "M19 5v14M5 5l12 7-12 7V5Z",
  reset: "M3 10a9 9 0 1 1 2 8M3 4v6h6",
  seed: "M12 21V10M12 14C4 15 2 10 3 5c6-1 10 2 9 9Zm0-4c0-6 4-8 9-7 1 6-3 10-9 10",
  chart: "M3 3v18h18M7 16l5-7 4 3 5-7",
  sparkles: "m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Zm8-1v4m-2-2h4",
  compass: "m16 8-3 5-5 3 3-5 5-3Zm6 4a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
  info: "M12 11v6m0-10v.1M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
} as const;
export type IconName = keyof typeof paths;
export function Icon({ name, size = 20, className, style }: { name: IconName; size?: number; className?: string; style?: CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className} style={style}><path d={paths[name]} /></svg>;
}
