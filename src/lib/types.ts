export type StatKey = "SHP" | "CON" | "RNG" | "DEP" | "IMP" | "COL";

export const STAT_LABELS: Record<StatKey, string> = {
  SHP: "Shipping",
  CON: "Consistency",
  RNG: "Range",
  DEP: "Depth",
  IMP: "Impact",
  COL: "Collab",
};

export const STAT_HINTS: Record<StatKey, string> = {
  SHP: "Commits, PRs, releases and deployed projects in the last 12 months",
  CON: "Active days and longest streak over the last 12 months",
  RNG: "How many languages you write, weighted by how evenly you use them",
  DEP: "Size and lifespan of your projects, plus years on GitHub",
  IMP: "Stars, forks and followers",
  COL: "PRs, reviews and issues, plus repos you contributed to",
};

export type Rarity = "bronze" | "silver" | "gold" | "legacy";

export interface Move {
  name: string;
  description: string;
  url: string;
  language: string | null;
  languageColor: string | null;
  power: number;
  stars: number;
  deployed: boolean;
  homepage: string | null;
}

export interface Ability {
  name: string;
  description: string;
}

export interface LanguageShare {
  name: string;
  color: string | null;
  share: number; // 0..1
}

export interface CardData {
  login: string;
  name: string;
  avatarUrl: string;
  location: string | null;
  createdAt: string;
  overall: number;
  rarity: Rarity;
  role: { code: string; name: string };
  element: { name: string; color: string };
  stats: Record<StatKey, number>;
  moves: Move[];
  abilities: Ability[];
  languages: LanguageShare[];
  raw: {
    contributions: number;
    commits: number;
    pullRequests: number;
    reviews: number;
    activeDays: number;
    longestStreak: number;
    stars: number;
    followers: number;
    publicRepos: number;
    deployedProjects: number;
  };
  generatedAt: string;
}
