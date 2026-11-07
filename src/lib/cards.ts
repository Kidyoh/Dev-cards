import { unstable_cache } from "next/cache";
import { fetchUser, GitHubError, searchUsers } from "./github";
import { computeCard } from "./stats";
import { DEMO, demoSearch, demoUser } from "./demo";
import type { CardData } from "./types";

const SIX_HOURS = 60 * 60 * 6;

export const USERNAME_RE = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

export function isValidUsername(u: string) {
  return USERNAME_RE.test(u);
}

async function buildCard(login: string, hint?: { location?: string; language?: string }): Promise<CardData> {
  const user = DEMO ? demoUser(login, hint) : await fetchUser(login);
  return computeCard(user);
}

const cachedCard = unstable_cache((login: string) => buildCard(login), ["card-v1"], {
  revalidate: SIX_HOURS,
});

/** Fetch + score a user's card. Cached for six hours per username. */
export async function getCard(login: string): Promise<CardData> {
  if (!isValidUsername(login)) throw new GitHubError(`"${login}" isn't a valid GitHub username`, 400);
  return cachedCard(login.toLowerCase());
}

// --- Leaderboards (no database: GitHub user search + live scoring, cached) -------------------

export const COUNTRIES = [
  "Nigeria", "Kenya", "Ghana", "South Africa", "Egypt", "India", "Pakistan", "Indonesia", "Japan",
  "China", "Brazil", "Argentina", "Mexico", "United States", "Canada", "United Kingdom", "Germany",
  "France", "Spain", "Netherlands", "Poland", "Ukraine", "Australia",
];

export const STACKS = [
  "TypeScript", "JavaScript", "Python", "Rust", "Go", "Java", "Kotlin", "Swift", "C++", "C#", "Ruby",
  "PHP", "Elixir", "Haskell", "Zig", "Dart",
];

export type Board = { kind: "country" | "stack"; value: string };

async function mapLimit<T, R>(items: T[], limit: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) {
        const idx = i++;
        out[idx] = await fn(items[idx]);
      }
    }),
  );
  return out;
}

async function buildBoard(kind: Board["kind"], value: string): Promise<CardData[]> {
  const n = 15;
  let logins: string[];
  if (DEMO) {
    logins = demoSearch(`${kind}:${value}`, n);
  } else {
    // Pre-filter to people with some following so we score real, active developers.
    const q =
      kind === "country"
        ? `location:"${value}" type:user followers:>=50 repos:>=5`
        : `language:"${value}" type:user followers:>=200 repos:>=5`;
    logins = await searchUsers(q, n);
  }
  const hint = kind === "country" ? { location: value } : { language: value };
  const cards = await mapLimit(logins, 5, async (login) => {
    try {
      return DEMO ? await buildCard(login, hint) : await getCard(login);
    } catch {
      return null;
    }
  });
  return cards.filter((c): c is CardData => c !== null).sort((a, b) => b.overall - a.overall);
}

const cachedBoard = unstable_cache(buildBoard, ["board-v1"], { revalidate: SIX_HOURS });

export async function getBoard(board: Board): Promise<CardData[]> {
  const list = board.kind === "country" ? COUNTRIES : STACKS;
  const value = list.find((v) => v.toLowerCase() === board.value.toLowerCase());
  if (!value) throw new GitHubError(`Unknown ${board.kind} "${board.value}"`, 400);
  return cachedBoard(board.kind, value);
}
