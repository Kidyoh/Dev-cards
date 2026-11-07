import type { Rarity } from "./types";

/** Shield outline used by both the HTML card and the PNG renderer. viewBox 0 0 300 420. */
export const SHIELD_PATH =
  "M24 44 Q24 26 42 24 L104 20 Q126 18 138 8 L150 0 L162 8 Q174 18 196 20 L258 24 Q276 26 276 44 " +
  "L276 326 Q276 348 256 358 L162 414 Q150 421 138 414 L44 358 Q24 348 24 326 Z";

export interface RarityTheme {
  label: string;
  stops: [string, string, string];
  trim: string;
  text: string;
  sub: string;
  line: string;
}

export const RARITY: Record<Rarity, RarityTheme> = {
  bronze: {
    label: "Bronze",
    stops: ["#7a4a22", "#d9a066", "#6a3c18"],
    trim: "#4a2a10",
    text: "#2a1606",
    sub: "#4a2a10",
    line: "rgba(42,22,6,0.35)",
  },
  silver: {
    label: "Silver",
    stops: ["#8d97a4", "#f1f4f8", "#7d8794"],
    trim: "#5d6672",
    text: "#18202b",
    sub: "#3a4350",
    line: "rgba(24,32,43,0.3)",
  },
  gold: {
    label: "Gold",
    stops: ["#b4861a", "#f8e08a", "#9d7210"],
    trim: "#6f5208",
    text: "#2a1f03",
    sub: "#4d3b06",
    line: "rgba(42,31,3,0.35)",
  },
  legacy: {
    label: "Legacy",
    stops: ["#ece7da", "#ffffff", "#e3dccb"],
    trim: "#c9a23f",
    text: "#3a2e12",
    sub: "#7a6326",
    line: "rgba(201,162,63,0.7)",
  },
};

/** The shield as a standalone SVG string (used as a background image in the PNG renderer). */
export function shieldSvg(rarity: Rarity, w = 300, h = 420): string {
  const t = RARITY[rarity];
  const marble =
    rarity === "legacy"
      ? `<path d="M40 120 C 90 90, 140 170, 210 120 S 280 160, 280 140" stroke="#d8ccae" stroke-width="1.2" fill="none" opacity="0.7"/>
         <path d="M30 240 C 100 200, 150 280, 260 230" stroke="#d8ccae" stroke-width="1" fill="none" opacity="0.6"/>
         <path d="M60 330 C 120 300, 190 350, 250 300" stroke="#e0b95a" stroke-width="0.8" fill="none" opacity="0.6"/>`
      : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 300 420">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${t.stops[0]}"/>
      <stop offset="0.5" stop-color="${t.stops[1]}"/>
      <stop offset="1" stop-color="${t.stops[2]}"/>
    </linearGradient>
    <linearGradient id="shine" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fff" stop-opacity="0"/>
      <stop offset="0.5" stop-color="#fff" stop-opacity="0.35"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <path d="${SHIELD_PATH}" fill="url(#g)" stroke="${t.trim}" stroke-width="5"/>
  <path d="${SHIELD_PATH}" fill="none" stroke="${t.trim}" stroke-opacity="0.5" stroke-width="1.5" transform="translate(12 14) scale(0.92)"/>
  ${marble}
  <path d="M60 40 L120 40 L70 330 L30 300 Z" fill="url(#shine)" opacity="0.5"/>
</svg>`;
}

export function shieldDataUri(rarity: Rarity, w?: number, h?: number) {
  return `data:image/svg+xml;base64,${Buffer.from(shieldSvg(rarity, w, h)).toString("base64")}`;
}
