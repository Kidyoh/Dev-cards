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

const RAY_COLOR: Record<Rarity, [string, number]> = {
  bronze: ["#fff", 0.1],
  silver: ["#fff", 0.28],
  gold: ["#fff6c9", 0.35],
  legacy: ["#d7b45a", 0.2],
};

function seeded(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 13), 0x5bd1e995);
    return ((h >>> 0) % 10000) / 10000;
  };
}

/**
 * The full card artwork as SVG, matching the on-site card: rarity gradient, light streaks radiating
 * from behind the avatar, gold shards, marble veins (legacy), a diagonal sheen and foil tint, trim.
 */
export function shieldSvg(rarity: Rarity, w = 300, h = 420): string {
  const t = RARITY[rarity];
  const [rayColor, rayOpacity] = RAY_COLOR[rarity];
  const rays = Array.from({ length: 18 }, (_, i) => {
    const a0 = (i * 20 * Math.PI) / 180;
    const a1 = ((i * 20 + 9) * Math.PI) / 180;
    const cx = 189, cy = 117, r = 420;
    return `<path d="M${cx} ${cy} L${(cx + Math.cos(a0) * r).toFixed(1)} ${(cy + Math.sin(a0) * r).toFixed(1)} L${(cx + Math.cos(a1) * r).toFixed(1)} ${(cy + Math.sin(a1) * r).toFixed(1)} Z"/>`;
  }).join("");
  const marble =
    rarity === "legacy"
      ? `<g fill="none" opacity="0.7">
           <path d="M40 120 C 90 90, 140 170, 210 120 S 280 160, 280 140" stroke="#d8ccae" stroke-width="1.2"/>
           <path d="M30 240 C 100 200, 150 280, 260 230" stroke="#d8ccae" stroke-width="1"/>
           <path d="M60 330 C 120 300, 190 350, 250 300" stroke="#e0b95a" stroke-width="0.8"/>
         </g>`
      : "";
  const shards =
    rarity === "gold" || rarity === "legacy"
      ? `<g fill="url(#shard)" opacity="0.92">
           <polygon points="232,44 252,38 246,70 230,76"/>
           <polygon points="256,60 268,56 262,92 252,96"/>
           <polygon points="104,52 116,46 110,74 100,78"/>
           <polygon points="252,150 262,146 258,172 250,176"/>
         </g>`
      : "";
  const shard = rarity === "legacy" ? ["#fffaf0", "#d9b55c", "#9c7a2a"] : ["#fff5c2", "#e2b23c", "#8a6410"];
  // foil tint per rarity (the site animates this with the pointer; the PNG freezes it mid-sweep)
  const foil =
    rarity === "legacy"
      ? `<rect width="300" height="420" fill="url(#prism)" opacity="0.16"/>`
      : rarity === "gold"
        ? `<rect width="300" height="420" fill="url(#prism)" opacity="0.08"/>`
        : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 300 420">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${t.stops[0]}"/>
      <stop offset="0.5" stop-color="${t.stops[1]}"/>
      <stop offset="1" stop-color="${t.stops[2]}"/>
    </linearGradient>
    <linearGradient id="shard" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${shard[0]}"/><stop offset="0.5" stop-color="${shard[1]}"/><stop offset="1" stop-color="${shard[2]}"/>
    </linearGradient>
    <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="0.35">
      <stop offset="0.28" stop-color="#fff" stop-opacity="0"/>
      <stop offset="0.42" stop-color="#fff" stop-opacity="0.55"/>
      <stop offset="0.5" stop-color="#fff" stop-opacity="0"/>
      <stop offset="0.62" stop-color="#fff" stop-opacity="0.22"/>
      <stop offset="0.7" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="prism" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ff7ab8"/><stop offset="0.25" stop-color="#ffe58a"/>
      <stop offset="0.5" stop-color="#5fe3c0"/><stop offset="0.75" stop-color="#6c8bff"/><stop offset="1" stop-color="#c44dff"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.63" cy="0.28" r="0.5">
      <stop offset="0" stop-color="#fff" stop-opacity="0.45"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>
    <clipPath id="c"><path d="${SHIELD_PATH}"/></clipPath>
  </defs>
  <path d="${SHIELD_PATH}" fill="url(#g)"/>
  <g clip-path="url(#c)">
    <g fill="${rayColor}" opacity="${rayOpacity}">${rays}</g>
    <rect width="300" height="420" fill="url(#glow)"/>
    ${marble}
    <rect x="0" y="236" width="300" height="200" fill="#000" opacity="${rarity === "legacy" ? 0.02 : 0.06}"/>
    ${foil}
    <rect width="300" height="420" fill="url(#sheen)"/>
  </g>
  ${shards}
  <path d="${SHIELD_PATH}" fill="none" stroke="${t.trim}" stroke-width="5"/>
  <path d="${SHIELD_PATH}" fill="none" stroke="${t.trim}" stroke-opacity="0.5" stroke-width="1.5" transform="translate(12 14) scale(0.92)"/>
</svg>`;
}

export function shieldDataUri(rarity: Rarity, w?: number, h?: number) {
  return `data:image/svg+xml;base64,${Buffer.from(shieldSvg(rarity, w, h)).toString("base64")}`;
}

/** Twinkling sparkles from the site card, frozen, as an SVG overlay (same positions per user). */
export function sparklesSvg(rarity: Rarity, login: string, w = 300, h = 420, glow = true): string {
  const count = rarity === "legacy" ? 9 : rarity === "gold" ? 6 : rarity === "silver" ? 3 : 0;
  const r = seeded(login);
  let body = "";
  for (let i = 0; i < count; i++) {
    const x = 40 + r() * 220, y = 30 + r() * 320, size = 6 + r() * 10;
    r(); r(); // keep positions in step with the site's generator (delay, duration)
    const k = size / 20;
    const star = "M10 0 C11 7 13 9 20 10 C13 11 11 13 10 20 C9 13 7 11 0 10 C7 9 9 7 10 0Z";
    body += `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${k.toFixed(3)})">${glow ? `<path d="${star}" fill="#fff" filter="url(#b)"/>` : `<circle cx="10" cy="10" r="6" fill="#fff" opacity="0.35"/>`}<path d="M10 0 C11 7 13 9 20 10 C13 11 11 13 10 20 C9 13 7 11 0 10 C7 9 9 7 10 0Z" fill="#fff"/></g>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 300 420"><defs><filter id="b" x="-1" y="-1" width="3" height="3"><feGaussianBlur stdDeviation="2.2"/></filter></defs>${body}</svg>`;
}

/** Server version: no blur filter (blur is the most expensive thing to rasterise on Workers). */
export function sparklesDataUri(rarity: Rarity, login: string, w = 300, h = 420) {
  return `data:image/svg+xml;base64,${Buffer.from(sparklesSvg(rarity, login, w, h, false)).toString("base64")}`;
}
