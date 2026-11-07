import type { GhRepo, GhUser } from "./github";
import type { Ability, CardData, LanguageShare, Move, Rarity, StatKey } from "./types";

/** Saturating curve: 0 at x=0, approaches 99 as x grows; k is the "half-way-ish" point. */
function sat(x: number, k: number): number {
  if (!isFinite(x) || x <= 0) return 0;
  return 99 * (1 - Math.exp(-x / k));
}

function clampStat(n: number): number {
  return Math.max(10, Math.min(99, Math.round(n)));
}

const DAY = 86_400_000;

function isDeployed(r: GhRepo): boolean {
  return Boolean(r.homepageUrl && r.homepageUrl.trim()) || r.deployments.totalCount > 0;
}

// --- Elements (Pokémon-style "type") come from the dominant language -------------------------

const ELEMENTS: { name: string; color: string; langs: string[] }[] = [
  { name: "Electric", color: "#f5c518", langs: ["TypeScript", "JavaScript", "Svelte", "Vue", "Astro"] },
  { name: "Psychic", color: "#c44dff", langs: ["Python", "Jupyter Notebook", "R", "Julia"] },
  { name: "Steel", color: "#8fa3b8", langs: ["Rust", "Zig", "Nim"] },
  { name: "Water", color: "#2f9bff", langs: ["Go", "Dart", "Elixir", "Erlang"] },
  { name: "Fire", color: "#ff5a36", langs: ["C", "C++", "Assembly", "CUDA"] },
  { name: "Earth", color: "#b07a3c", langs: ["Java", "Kotlin", "Scala", "Groovy", "C#", "F#"] },
  { name: "Fairy", color: "#ff7ab8", langs: ["Ruby", "PHP", "Crystal", "Swift", "Objective-C"] },
  { name: "Ghost", color: "#6c5ce7", langs: ["Haskell", "OCaml", "Clojure", "Elm", "Lisp", "Scheme"] },
  { name: "Grass", color: "#3cba54", langs: ["HTML", "CSS", "SCSS", "MDX", "Markdown"] },
  { name: "Rock", color: "#9c8b6e", langs: ["Shell", "PowerShell", "Dockerfile", "HCL", "Nix", "Lua"] },
];

function elementFor(lang: string | undefined) {
  const found = ELEMENTS.find((e) => lang && e.langs.includes(lang));
  return found ? { name: found.name, color: found.color } : { name: "Normal", color: "#a8a29e" };
}

// --- Roles (like a football position) come from the strongest stat ---------------------------

const ROLES: Record<StatKey, { code: string; name: string }> = {
  SHP: { code: "SHP", name: "Shipper" },
  CON: { code: "GRD", name: "Grinder" },
  RNG: { code: "PLY", name: "Polyglot" },
  DEP: { code: "ARC", name: "Architect" },
  IMP: { code: "STR", name: "Star" },
  COL: { code: "PMK", name: "Playmaker" },
};

const WEIGHTS: Record<StatKey, number> = { SHP: 0.22, CON: 0.2, DEP: 0.18, IMP: 0.14, COL: 0.14, RNG: 0.12 };

export function rarityFor(overall: number): Rarity {
  if (overall >= 85) return "legacy";
  if (overall >= 72) return "gold";
  if (overall >= 58) return "silver";
  return "bronze";
}

function calendarStats(user: GhUser) {
  const days = user.contributionsCollection.contributionCalendar.weeks.flatMap((w) => w.contributionDays);
  let active = 0;
  let longest = 0;
  let run = 0;
  let weekend = 0;
  let total = 0;
  for (const d of days) {
    total += d.contributionCount;
    if (d.weekday === 0 || d.weekday === 6) weekend += d.contributionCount;
    if (d.contributionCount > 0) {
      active++;
      run++;
      longest = Math.max(longest, run);
    } else {
      run = 0;
    }
  }
  return { active, longest, weekendShare: total ? weekend / total : 0, totalDays: days.length || 365 };
}

function languageShares(repos: GhRepo[]): LanguageShare[] {
  const bytes = new Map<string, { size: number; color: string | null }>();
  for (const r of repos) {
    for (const e of r.languages.edges) {
      const cur = bytes.get(e.node.name) ?? { size: 0, color: e.node.color };
      // Square-root dampening so one giant vendored repo doesn't erase everything else.
      cur.size += Math.sqrt(e.size);
      bytes.set(e.node.name, cur);
    }
  }
  const total = [...bytes.values()].reduce((a, b) => a + b.size, 0);
  if (!total) return [];
  return [...bytes.entries()]
    .map(([name, v]) => ({ name, color: v.color, share: v.size / total }))
    .sort((a, b) => b.share - a.share);
}

function buildMoves(repos: GhRepo[]): Move[] {
  const now = Date.now();
  const scored = repos.map((r) => {
    const lifespanDays = r.pushedAt ? (new Date(r.pushedAt).getTime() - new Date(r.createdAt).getTime()) / DAY : 0;
    const recent = r.pushedAt ? now - new Date(r.pushedAt).getTime() < 180 * DAY : false;
    const score =
      Math.log10(1 + r.stargazerCount) * 40 +
      Math.log10(1 + r.forkCount) * 15 +
      (isDeployed(r) ? 25 : 0) +
      Math.min(r.releases.totalCount, 10) * 2 +
      Math.min(lifespanDays / 30, 12) * 1.5 +
      (recent ? 8 : 0) +
      (r.description ? 4 : 0);
    return { r, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 3).map(({ r, score }) => ({
    name: r.name,
    description: (r.description ?? "No description. Pure vibes.").slice(0, 110),
    url: r.url,
    language: r.primaryLanguage?.name ?? null,
    languageColor: r.primaryLanguage?.color ?? null,
    // Pokémon-ish damage numbers: multiples of 10.
    power: Math.max(10, Math.min(250, Math.round(score / 10) * 10)),
    stars: r.stargazerCount,
    deployed: isDeployed(r),
    homepage: r.homepageUrl || null,
  }));
}

function buildAbilities(ctx: {
  longest: number;
  weekendShare: number;
  sigLangs: number;
  deployed: number;
  reviews: number;
  maxStars: number;
  years: number;
  active: number;
  contributedTo: number;
}): Ability[] {
  const candidates: (Ability & { when: boolean; rank: number })[] = [
    { rank: 1, when: ctx.maxStars >= 1000, name: "Crowd Favorite", description: "Has a project with 1,000+ stars." },
    { rank: 2, when: ctx.longest >= 60, name: "Unbreakable", description: `Kept a ${ctx.longest}-day contribution streak.` },
    { rank: 3, when: ctx.deployed >= 3, name: "Ship It", description: `${ctx.deployed} projects live in production.` },
    { rank: 4, when: ctx.reviews >= 50, name: "Reviewer's Eye", description: `Reviewed ${ctx.reviews} pull requests this year.` },
    { rank: 5, when: ctx.sigLangs >= 6, name: "Polyglot", description: `Writes seriously in ${ctx.sigLangs} languages.` },
    { rank: 6, when: ctx.contributedTo >= 10, name: "Open Hand", description: `Contributed to ${ctx.contributedTo} other people's repos.` },
    { rank: 7, when: ctx.longest >= 21 && ctx.longest < 60, name: "Streak Mode", description: `Kept a ${ctx.longest}-day contribution streak.` },
    { rank: 8, when: ctx.weekendShare >= 0.3, name: "Weekend Warrior", description: `${Math.round(ctx.weekendShare * 100)}% of contributions land on weekends.` },
    { rank: 9, when: ctx.years >= 10, name: "Veteran", description: `${Math.floor(ctx.years)} years on GitHub.` },
    { rank: 10, when: ctx.maxStars >= 100 && ctx.maxStars < 1000, name: "Rising Star", description: "Has a project with 100+ stars." },
    { rank: 11, when: ctx.years < 1, name: "Rookie Season", description: "Joined GitHub less than a year ago." },
    { rank: 12, when: ctx.active >= 200, name: "Always On", description: `Active on ${ctx.active} days this year.` },
  ];
  const picked = candidates.filter((c) => c.when).sort((a, b) => a.rank - b.rank).slice(0, 2);
  if (!picked.length) return [{ name: "Hidden Potential", description: "Every legend starts with a single commit." }];
  return picked.map(({ name, description }) => ({ name, description }));
}

export function computeCard(user: GhUser): CardData {
  const cc = user.contributionsCollection;
  const repos = user.repositories.nodes;
  const cal = calendarStats(user);
  const langs = languageShares(repos);
  const sigLangs = langs.filter((l) => l.share >= 0.03).length;
  const deployed = repos.filter(isDeployed).length;
  const releases = repos.reduce((a, r) => a + Math.min(r.releases.totalCount, 20), 0);
  const stars = repos.reduce((a, r) => a + r.stargazerCount, 0);
  const forks = repos.reduce((a, r) => a + r.forkCount, 0);
  const maxStars = repos.reduce((a, r) => Math.max(a, r.stargazerCount), 0);
  const years = (Date.now() - new Date(user.createdAt).getTime()) / (365.25 * DAY);
  const commits = cc.totalCommitContributions + cc.restrictedContributionsCount;

  // Shipping: output over the last year, with extra credit for things that actually got released.
  const SHP = sat(commits + cc.totalPullRequestContributions * 3 + releases * 4 + deployed * 15, 700);

  // Consistency: how many days you show up, and how long you can keep it going.
  const CON = 99 * (0.65 * Math.min(1, cal.active / 260) + 0.35 * Math.min(1, cal.longest / 60));

  // Range: effective number of languages (exp of Shannon entropy) plus a count of serious ones.
  const entropy = -langs.reduce((a, l) => a + (l.share > 0 ? l.share * Math.log(l.share) : 0), 0);
  const effective = Math.exp(entropy);
  const RNG = 0.6 * sat(effective - 1, 2.2) + 0.4 * sat(sigLangs - 1, 3);

  // Depth: big, long-lived projects and a long history on the platform.
  const top = [...repos]
    .sort((a, b) => (b.diskUsage ?? 0) - (a.diskUsage ?? 0))
    .slice(0, 10);
  const maxKb = top[0]?.diskUsage ?? 0;
  const avgLifespan = top.length
    ? top.reduce(
        (a, r) => a + (r.pushedAt ? (new Date(r.pushedAt).getTime() - new Date(r.createdAt).getTime()) / DAY : 0),
        0,
      ) / top.length
    : 0;
  const DEP = 0.35 * sat(maxKb, 15_000) + 0.4 * sat(avgLifespan, 240) + 0.25 * sat(years, 5);

  // Impact: does anyone care? Log-ish via a wide saturation constant.
  const IMP = sat(Math.max(0, Math.log10(1 + stars + forks * 2 + user.followers.totalCount * 1.5) - 0.7), 1.3);

  // Collab: working with other humans.
  const COL = sat(
    cc.totalPullRequestContributions +
      cc.totalPullRequestReviewContributions * 1.5 +
      cc.totalIssueContributions * 0.5 +
      user.repositoriesContributedTo.totalCount * 6,
    120,
  );

  const stats: Record<StatKey, number> = {
    SHP: clampStat(SHP),
    CON: clampStat(CON),
    RNG: clampStat(RNG),
    DEP: clampStat(DEP),
    IMP: clampStat(IMP),
    COL: clampStat(COL),
  };

  // Overall: weighted average, then a gentle bonus for your two best stats (specialists shine).
  const keys = Object.keys(stats) as StatKey[];
  const weighted = keys.reduce((a, k) => a + stats[k] * WEIGHTS[k], 0);
  const best2 = [...keys].sort((a, b) => stats[b] - stats[a]).slice(0, 2);
  const overall = Math.max(
    10,
    Math.min(99, Math.round(weighted * 0.75 + ((stats[best2[0]] + stats[best2[1]]) / 2) * 0.25)),
  );

  const element = elementFor(langs[0]?.name);

  return {
    login: user.login,
    name: user.name || user.login,
    avatarUrl: user.avatarUrl,
    location: user.location,
    createdAt: user.createdAt,
    overall,
    rarity: rarityFor(overall),
    role: ROLES[best2[0]],
    element,
    stats,
    moves: buildMoves(repos),
    abilities: buildAbilities({
      longest: cal.longest,
      weekendShare: cal.weekendShare,
      sigLangs,
      deployed,
      reviews: cc.totalPullRequestReviewContributions,
      maxStars,
      years,
      active: cal.active,
      contributedTo: user.repositoriesContributedTo.totalCount,
    }),
    languages: langs.slice(0, 6),
    raw: {
      contributions: cc.contributionCalendar.totalContributions,
      commits,
      pullRequests: cc.totalPullRequestContributions,
      reviews: cc.totalPullRequestReviewContributions,
      activeDays: cal.active,
      longestStreak: cal.longest,
      stars,
      followers: user.followers.totalCount,
      publicRepos: user.repositories.totalCount,
      deployedProjects: deployed,
    },
    generatedAt: new Date().toISOString(),
  };
}
