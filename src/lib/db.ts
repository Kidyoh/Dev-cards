import type { CardData } from "./types";
import { countryFromLocation } from "./countries";

/** Minimal D1 surface we use (avoids depending on the full workers-types package at runtime). */
export interface D1Like {
  prepare(sql: string): {
    bind(...values: unknown[]): {
      first<T = unknown>(): Promise<T | null>;
      all<T = unknown>(): Promise<{ results: T[] }>;
      run(): Promise<unknown>;
    };
  };
}

/** The D1 binding when running on Cloudflare (or `next dev` with wrangler), otherwise null. */
export async function getDB(): Promise<D1Like | null> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const ctx = await getCloudflareContext({ async: true });
    return ((ctx.env as Record<string, unknown>).DB as D1Like) ?? null;
  } catch {
    return null;
  }
}

export async function readCard(db: D1Like, login: string): Promise<{ card: CardData; scannedAt: number } | null> {
  const row = await db
    .prepare("SELECT data, scanned_at FROM cards WHERE login = ?")
    .bind(login.toLowerCase())
    .first<{ data: string; scanned_at: number }>();
  return row ? { card: JSON.parse(row.data) as CardData, scannedAt: row.scanned_at } : null;
}

export async function saveCard(db: D1Like, card: CardData): Promise<void> {
  const s = card.stats;
  await db
    .prepare(
      `INSERT INTO cards (login, name, avatar_url, country, top_language, overall, rarity, shp, con, rng, dep, imp, col, data, scanned_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(login) DO UPDATE SET
         name = excluded.name, avatar_url = excluded.avatar_url, country = excluded.country,
         top_language = excluded.top_language, overall = excluded.overall, rarity = excluded.rarity,
         shp = excluded.shp, con = excluded.con, rng = excluded.rng, dep = excluded.dep, imp = excluded.imp, col = excluded.col,
         data = excluded.data, scanned_at = excluded.scanned_at`,
    )
    .bind(
      card.login.toLowerCase(),
      card.name,
      card.avatarUrl,
      countryFromLocation(card.location),
      card.languages[0]?.name ?? null,
      card.overall,
      card.rarity,
      s.SHP, s.CON, s.RNG, s.DEP, s.IMP, s.COL,
      JSON.stringify(card),
      Date.now(),
    )
    .run();
}

/** Top scanned cards, optionally filtered by country or top language. */
export async function topCards(db: D1Like, filter: { country?: string; language?: string }, limit = 50): Promise<CardData[]> {
  const where = filter.country ? "WHERE country = ?" : filter.language ? "WHERE top_language = ? COLLATE NOCASE" : "";
  const args = filter.country ? [filter.country] : filter.language ? [filter.language] : [];
  const { results } = await db
    .prepare(`SELECT data FROM cards ${where} ORDER BY overall DESC, scanned_at DESC LIMIT ?`)
    .bind(...args, limit)
    .all<{ data: string }>();
  return results.map((r) => JSON.parse(r.data) as CardData);
}

export async function countCards(db: D1Like): Promise<number> {
  const row = await db.prepare("SELECT COUNT(*) AS n FROM cards").bind().first<{ n: number }>();
  return row?.n ?? 0;
}

export async function readBoard(db: D1Like, key: string, maxAgeMs: number): Promise<string[] | null> {
  const row = await db.prepare("SELECT data, fetched_at FROM boards WHERE key = ?").bind(key).first<{ data: string; fetched_at: number }>();
  if (!row || Date.now() - row.fetched_at > maxAgeMs) return null;
  return JSON.parse(row.data) as string[];
}

export async function saveBoard(db: D1Like, key: string, logins: string[]): Promise<void> {
  await db
    .prepare("INSERT INTO boards (key, data, fetched_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET data = excluded.data, fetched_at = excluded.fetched_at")
    .bind(key, JSON.stringify(logins), Date.now())
    .run();
}
