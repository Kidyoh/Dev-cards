import { rarityFor } from "./stats";
import type { CardData, Rarity } from "./types";

const AVATAR =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#2a303c"/><circle cx="50" cy="38" r="18" fill="#9aa3b2"/><path d="M14 100c4-24 20-34 36-34s32 10 36 34z" fill="#9aa3b2"/></svg>`,
  );

const PRESETS: Record<Rarity, { overall: number; stats: CardData["stats"]; role: CardData["role"]; el: CardData["element"]; lang: string; ability: string }> = {
  bronze: { overall: 48, stats: { SHP: 52, CON: 41, RNG: 30, DEP: 44, IMP: 22, COL: 35 }, role: { code: "SHP", name: "Shipper" }, el: { name: "Grass", color: "#3cba54" }, lang: "HTML", ability: "Rookie Season" },
  silver: { overall: 66, stats: { SHP: 70, CON: 74, RNG: 48, DEP: 60, IMP: 45, COL: 58 }, role: { code: "GRD", name: "Grinder" }, el: { name: "Psychic", color: "#c44dff" }, lang: "Python", ability: "Streak Mode" },
  gold: { overall: 79, stats: { SHP: 86, CON: 71, RNG: 66, DEP: 82, IMP: 74, COL: 77 }, role: { code: "ARC", name: "Architect" }, el: { name: "Steel", color: "#8fa3b8" }, lang: "Rust", ability: "Ship It" },
  legacy: { overall: 93, stats: { SHP: 95, CON: 92, RNG: 81, DEP: 96, IMP: 98, COL: 90 }, role: { code: "STR", name: "Star" }, el: { name: "Electric", color: "#f5c518" }, lang: "TypeScript", ability: "Crowd Favorite" },
};

/** Placeholder cards used to show off each rarity on the home page. Not real people. */
export function sampleCard(rarity: Rarity): CardData {
  const p = PRESETS[rarity];
  return {
    login: `you-${rarity}`,
    name: "Your Name",
    avatarUrl: AVATAR,
    location: null,
    createdAt: new Date(0).toISOString(),
    overall: p.overall,
    rarity: rarityFor(p.overall),
    role: p.role,
    element: p.el,
    stats: p.stats,
    moves: [],
    abilities: [{ name: p.ability, description: "" }],
    languages: [{ name: p.lang, color: null, share: 1 }],
    raw: { contributions: 0, commits: 0, pullRequests: 0, reviews: 0, activeDays: 0, longestStreak: 0, stars: 0, followers: 0, publicRepos: 0, deployedProjects: 0 },
    generatedAt: new Date(0).toISOString(),
  };
}
