/** Where the frontend talks to the API. Empty = same origin (local dev runs both together). */
export const API = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

import type { CardData } from "./types";

export type BoardRank = { rank: number; total: number } | null;
export type CardWithRank = CardData & { boardRank: BoardRank };

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function get<T>(path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API}${path}`);
  } catch {
    throw new ApiError("Couldn't reach Specsheet. Check your connection and try again.", 0);
  }
  const body = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new ApiError(body.error ?? `Request failed (${res.status})`, res.status);
  return body;
}

export const fetchCard = (login: string, rescan = false) =>
  get<CardWithRank>(`/api/card/${encodeURIComponent(login)}${rescan ? "?rescan=1" : ""}`);

export const fetchBoard = (lang?: string) =>
  get<{ cards: CardData[] }>(`/api/board${lang ? `?lang=${encodeURIComponent(lang)}` : ""}`);

export const imageUrl = (login: string, format: "card" | "og" = "og") =>
  `${API}/api/card/${encodeURIComponent(login)}/image?format=${format}`;

/** Share link: served by the API so crawlers get the card preview; people are forwarded to the card page. */
export const shareUrl = (login: string) => `${API}/s/${encodeURIComponent(login)}`;
