import { countryFromLocation } from "./countries";
import { getDB, rankOf, readCard, saveCard, topCards } from "./db";
import { DEMO, demoUser } from "./demo";
import { fetchUser, GitHubError } from "./github";
import { computeCard } from "./stats";
import type { CardData } from "./types";

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
const RESCAN_MIN_MS = 10 * 60 * 1000;

export async function getCard(
  login: string,
  hint?: { location?: string; language?: string },
  opts: { rescan?: boolean } = {},
): Promise<CardData> {
  if (!isValidUsername(login)) throw new GitHubError(`"${login}" isn't a valid GitHub username`, 400);
  const key = login.toLowerCase();
  const db = await getDB();

  if (db) {
    const hit = await readCard(db, key).catch(() => null);
    const age = hit ? Date.now() - hit.scannedAt : Infinity;
    // A rescan (e.g. after updating your GitHub location) is allowed once every 10 minutes.
    if (hit && age < (opts.rescan ? RESCAN_MIN_MS : SIX_HOURS_MS)) return hit.card;
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
  if (m && Date.now() - m.at < (opts.rescan ? RESCAN_MIN_MS : SIX_HOURS_MS)) return m.card;
  const card = await buildCard(key, hint);
  memory.set(key, { card, at: Date.now() });
  return card;
}

// --- The board: Ethiopia only, built from people scanned on Specsheet -----------------------

import { BOARD_COUNTRY, LANGUAGES } from "./board-config";
export { BOARD_COUNTRY, LANGUAGES };

export function onBoard(card: CardData): boolean {
  return countryFromLocation(card.location) === BOARD_COUNTRY;
}

/** Top scanned Ethiopian developers, optionally by main language. Nothing is fetched from GitHub here. */
export async function getBoard(language?: string, limit = 100): Promise<CardData[]> {
  const lang = language ? LANGUAGES.find((l) => l.toLowerCase() === language.toLowerCase()) : undefined;
  if (language && !lang) throw new GitHubError(`Unknown language "${language}"`, 400);
  const db = await getDB();
  if (db) return topCards(db, { country: BOARD_COUNTRY, language: lang }, limit);
  return [...memory.values()]
    .map((m) => m.card)
    .filter((c) => onBoard(c) && (!lang || c.languages[0]?.name === lang))
    .sort((a, b) => b.overall - a.overall)
    .slice(0, limit);
}

/** Rank on the board, or null when the card isn't on it. */
export async function boardRank(card: CardData): Promise<{ rank: number; total: number } | null> {
  if (!onBoard(card)) return null;
  const db = await getDB();
  if (db) return rankOf(db, card.login, BOARD_COUNTRY);
  const board = await getBoard();
  const i = board.findIndex((c) => c.login.toLowerCase() === card.login.toLowerCase());
  return i < 0 ? null : { rank: i + 1, total: board.length };
}
