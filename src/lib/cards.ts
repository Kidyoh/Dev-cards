import { COUNTRIES } from "./countries";
import { getDB, readBoard, readCard, saveBoard, saveCard, topCards } from "./db";
import { DEMO, demoSearch, demoUser } from "./demo";
import { fetchUser, GitHubError, searchUsers } from "./github";
import { computeCard } from "./stats";
import type { CardData } from "./types";

export { COUNTRIES };

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

export const USERNAME_RE = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

export function isValidUsername(u: string) {
  return USERNAME_RE.test(u);
}

async function buildCard(login: string, hint?: { location?: string; language?: string }): Promise<CardData> {
  const user = DEMO ? demoUser(login, hint) : await fetchUser(login);
  return computeCard(user);
}

// Fallback cache for when there's no D1 (e.g. `next dev` in demo mode). Per process only.
const memory = new Map<string, { card: CardData; at: number }>();

/**
 * Fetch + score a user's card. Cards are stored in D1 and reused for six hours; every scan also
 * puts the developer on the leaderboard.
 */
export async function getCard(login: string, hint?: { location?: string; language?: string }): Promise<CardData> {
  if (!isValidUsername(login)) throw new GitHubError(`"${login}" isn't a valid GitHub username`, 400);
  const key = login.toLowerCase();
  const db = await getDB();

  if (db) {
    const hit = await readCard(db, key).catch(() => null);
    if (hit && Date.now() - hit.scannedAt < SIX_HOURS_MS) return hit.card;
    try {
      const card = await buildCard(key, hint);
      await saveCard(db, card).catch(() => {});
      return card;
    } catch (e) {
      if (hit) return hit.card; // GitHub down or rate limited: serve the stale copy
      throw e;
    }
  }

  const m = memory.get(key);
  if (m && Date.now() - m.at < SIX_HOURS_MS) return m.card;
  const card = await buildCard(key, hint);
  memory.set(key, { card, at: Date.now() });
  return card;
}

// --- Leaderboards ---------------------------------------------------------------------------

export const STACKS = [
  "TypeScript", "JavaScript", "Python", "Rust", "Go", "Java", "Kotlin", "Swift", "C++", "C#", "Ruby",
  "PHP", "Elixir", "Haskell", "Zig", "Dart",
];

export type Board = { kind: "all" } | { kind: "country"; value: string } | { kind: "stack"; value: string };
export type BoardResult = {
  cards: CardData[];
  /** "scanned": ranked from people scanned on Specsheet. "github": seeded from GitHub's most-followed. */
  source: "scanned" | "github";
};

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

/** Seed list: GitHub's most-followed devs for a country/stack (cached 6h in D1). */
async function githubSeed(board: Exclude<Board, { kind: "all" }>): Promise<CardData[]> {
  const key = `${board.kind}:${board.value.toLowerCase()}`;
  const db = await getDB();
  let logins = db ? await readBoard(db, key, SIX_HOURS_MS).catch(() => null) : null;
  if (!logins) {
    if (DEMO) {
      logins = demoSearch(key, 15);
    } else {
      const q =
        board.kind === "country"
          ? `location:"${board.value}" type:user followers:>=50 repos:>=5`
          : `language:"${board.value}" type:user followers:>=200 repos:>=5`;
      logins = await searchUsers(q, 15);
    }
    if (db) await saveBoard(db, key, logins).catch(() => {});
  }
  const hint = board.kind === "country" ? { location: board.value } : { language: board.value };
  const cards = await mapLimit(logins, 5, async (login) => getCard(login, hint).catch(() => null));
  return cards.filter((c): c is CardData => c !== null).sort((a, b) => b.overall - a.overall);
}

export async function getBoard(board: Board): Promise<BoardResult> {
  if (board.kind !== "all") {
    const want = board.value.toLowerCase();
    const list = board.kind === "country" ? COUNTRIES : STACKS;
    const value = list.find((v) => v.toLowerCase() === want);
    if (!value) throw new GitHubError(`Unknown ${board.kind} "${board.value}"`, 400);
    board = { ...board, value };
  }

  const db = await getDB();
  if (db) {
    const filter = board.kind === "country" ? { country: board.value } : board.kind === "stack" ? { language: board.value } : {};
    const scanned = await topCards(db, filter, 50).catch(() => [] as CardData[]);
    if (scanned.length >= 5 || board.kind === "all") return { cards: scanned, source: "scanned" };
  }
  if (board.kind === "all") {
    const local = [...memory.values()].map((m) => m.card).sort((a, b) => b.overall - a.overall).slice(0, 50);
    return { cards: local, source: "scanned" };
  }
  // Too few scans here yet: seed from GitHub. Those scans land in D1, so the board fills itself.
  return { cards: await githubSeed(board), source: "github" };
}
