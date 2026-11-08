import type { GhRepo, GhUser } from "./github";

/**
 * Demo mode (SPECSHEET_DEMO=1): deterministic, made-up GitHub data per username so the app can be
 * run and designed without a GitHub token. Never used when SPECSHEET_DEMO is unset.
 */
export const DEMO = process.env.SPECSHEET_DEMO === "1";

function rng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const LANGS: [string, string][] = [
  ["TypeScript", "#3178c6"],
  ["Python", "#3572A5"],
  ["Rust", "#dea584"],
  ["Go", "#00ADD8"],
  ["C++", "#f34b7d"],
  ["Java", "#b07219"],
  ["Ruby", "#701516"],
  ["Shell", "#89e051"],
  ["CSS", "#563d7c"],
  ["Haskell", "#5e5086"],
];
const WORDS = ["nova", "forge", "pulse", "atlas", "ember", "quill", "orbit", "vector", "lumen", "drift", "cobalt", "relay"];
const SUFFIX = ["", "-js", "-cli", "-ui", "-api", "-kit", "-rs", "-db"];
const COUNTRIES = ["Nigeria", "Kenya", "Brazil", "India", "Germany", "United States", "Japan", "Canada"];

export function demoUser(login: string, hint?: { location?: string; language?: string }): GhUser {
  const r = rng(login.toLowerCase());
  const talent = Math.pow(r(), 1.6); // 0..1, skewed low so most demo cards are bronze/silver
  const years = 0.5 + r() * 12;
  const created = new Date(Date.now() - years * 365.25 * 86_400_000);
  const activity = 0.1 + talent * 0.85;

  const weeks = Array.from({ length: 53 }, (_, w) => ({
    contributionDays: Array.from({ length: 7 }, (_, d) => {
      const date = new Date(Date.now() - ((52 - w) * 7 + (6 - d)) * 86_400_000);
      const on = r() < activity * (d === 0 || d === 6 ? 0.6 : 1);
      return {
        date: date.toISOString().slice(0, 10),
        contributionCount: on ? 1 + Math.floor(r() * 12 * activity) : 0,
        weekday: d,
      };
    }),
  }));
  const total = weeks.flatMap((w) => w.contributionDays).reduce((a, d) => a + d.contributionCount, 0);

  const langOffset = hint?.language
    ? Math.max(0, LANGS.findIndex(([n]) => n.toLowerCase() === hint.language!.toLowerCase()))
    : Math.floor(r() * LANGS.length);
  const langCount = 1 + Math.floor(r() * 6 * (0.4 + talent));
  const repoCount = 3 + Math.floor(r() * 40 * (0.3 + talent));
  const repos: GhRepo[] = Array.from({ length: repoCount }, (_, i) => {
    const [ln, lc] = LANGS[(langOffset + Math.floor(r() * langCount)) % LANGS.length];
    const stars = Math.floor(Math.pow(r(), 3 - talent * 2) * 3000 * talent * (i === 0 ? 3 : 1));
    const repoCreated = new Date(created.getTime() + r() * (Date.now() - created.getTime()));
    const pushed = new Date(repoCreated.getTime() + r() * (Date.now() - repoCreated.getTime()));
    const second = LANGS[(langOffset + 1 + Math.floor(r() * langCount)) % LANGS.length];
    return {
      name: WORDS[Math.floor(r() * WORDS.length)] + SUFFIX[Math.floor(r() * SUFFIX.length)] + (i > 11 ? `-${i}` : ""),
      description: r() < 0.8 ? `A ${ln} project that does one thing really well.` : null,
      url: `https://github.com/${login}`,
      homepageUrl: r() < 0.25 + talent * 0.2 ? "https://example.com" : null,
      stargazerCount: stars,
      forkCount: Math.floor(stars * r() * 0.2),
      diskUsage: Math.floor(Math.pow(r(), 2) * 40_000 * (0.2 + talent)),
      pushedAt: pushed.toISOString(),
      createdAt: repoCreated.toISOString(),
      primaryLanguage: { name: ln, color: lc },
      languages: {
        edges: [
          { size: Math.floor(10_000 + r() * 400_000), node: { name: ln, color: lc } },
          { size: Math.floor(r() * 60_000), node: { name: second[0], color: second[1] } },
        ],
      },
      deployments: { totalCount: r() < 0.15 ? Math.floor(r() * 30) : 0 },
      releases: { totalCount: r() < 0.3 ? Math.floor(r() * 15) : 0 },
    };
  });

  return {
    login,
    name: login.charAt(0).toUpperCase() + login.slice(1),
    avatarUrl: `https://avatars.githubusercontent.com/${encodeURIComponent(login)}?size=400`,
    location: hint?.location ?? COUNTRIES[Math.floor(r() * COUNTRIES.length)],
    createdAt: created.toISOString(),
    followers: { totalCount: Math.floor(Math.pow(talent, 3) * 5000 * r()) },
    repositoriesContributedTo: { totalCount: Math.floor(talent * r() * 30) },
    contributionsCollection: {
      totalCommitContributions: Math.floor(total * 0.75),
      totalPullRequestContributions: Math.floor(total * 0.12),
      totalPullRequestReviewContributions: Math.floor(total * 0.08 * talent),
      totalIssueContributions: Math.floor(total * 0.05),
      restrictedContributionsCount: 0,
      contributionCalendar: { totalContributions: total, weeks },
    },
    repositories: { totalCount: repoCount, nodes: repos },
  };
}

export function demoSearch(seed: string, n: number): string[] {
  const r = rng(seed);
  const names = ["ada", "linus", "grace", "ken", "margaret", "dennis", "barbara", "guido", "yukihiro", "anders", "sophie", "chidi", "amara", "kofi", "priya", "mateo", "lena", "hiro", "zara", "tunde"];
  return Array.from({ length: n }, (_, i) => `${names[Math.floor(r() * names.length)]}${Math.floor(r() * 900 + 100)}${i}`);
}
