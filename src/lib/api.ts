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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** GET JSON from the API, retrying network failures and 5xx (the Worker can hit its CPU limit). */
async function get<T>(path: string, tries = 4): Promise<T> {
  let last: ApiError = new ApiError("Couldn't reach Specsheet. Check your connection and try again.", 0);
  for (let i = 0; i < tries; i++) {
    if (i) await sleep(500 * i);
    let res: Response;
    try {
      res = await fetch(`${API}${path}`);
    } catch {
      continue; // network / CORS-less error page: retry
    }
    const body = (await res.json().catch(() => ({}))) as T & { error?: string };
    if (res.ok) return body;
    last = new ApiError(body.error ?? `Request failed (${res.status})`, res.status);
    if (res.status < 500) throw last; // 400/404: a real answer, don't retry
  }
  throw last;
}

export const fetchCard = (login: string, rescan = false) =>
  get<CardWithRank>(`/api/card/${encodeURIComponent(login)}${rescan ? "?rescan=1" : ""}`);

export const fetchBoard = (lang?: string) =>
  get<{ cards: CardData[] }>(`/api/board${lang ? `?lang=${encodeURIComponent(lang)}` : ""}`);

export const imageUrl = (login: string, format: "card" | "og" = "og") =>
  `${API}/api/card/${encodeURIComponent(login)}/image?format=${format}`;

/** Public site address (specsheet.pro.et in production). */
export const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");

/**
 * Share link: the normal card URL. Link-preview bots (Telegram, X, WhatsApp…) hitting /u/<name> are
 * routed by vercel.json to the API's preview page, so the card still shows up in the preview.
 */
export const shareUrl = (login: string) =>
  `${SITE || (typeof window !== "undefined" ? window.location.origin : "")}/u/${encodeURIComponent(login)}`;
