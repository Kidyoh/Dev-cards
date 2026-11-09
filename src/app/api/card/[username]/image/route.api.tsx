import { ImageResponse } from "next/og";
import { getCard } from "@/lib/cards";

import { GitHubError } from "@/lib/github";
import { avatarDataUri, CardShot, cardShotSize, fonts, OgImage } from "@/lib/render";
import { POSTER, SpecPoster } from "@/lib/poster";
import { siteUrl } from "@/lib/site";

export const runtime = "nodejs";

type KVPut = { put(key: string, value: ArrayBuffer, opts?: { expirationTtl?: number }): Promise<void> };

async function imagesKV(): Promise<KVPut | null> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const { env } = await getCloudflareContext({ async: true });
    return ((env as Record<string, unknown>).IMAGES as KVPut) ?? null;
  } catch {
    return null;
  }
}

type EdgeCache = { match(r: Request): Promise<Response | undefined>; put(r: Request, res: Response): Promise<void> };

/** Cloudflare's edge cache when running on Workers (rendering is CPU-heavy, so render once per 6h). */
function edgeCache(): EdgeCache | null {
  const c = (globalThis as unknown as { caches?: { default?: EdgeCache } }).caches;
  return c?.default ?? null;
}

export async function GET(req: Request, ctx: { params: Promise<{ username: string }> }) {
  const cache = edgeCache();
  const key = new Request(new URL(req.url).toString().toLowerCase(), { method: "GET" });
  if (cache) {
    const hit = await cache.match(key).catch(() => undefined);
    if (hit) return hit;
  }
  const res = await render(req, ctx);
  if (cache && res.status === 200) {
    // clone before returning; the cached copy is stored in the background of this request
    await cache.put(key, res.clone()).catch(() => {});
  }
  return res;
}

async function render(req: Request, { params }: { params: Promise<{ username: string }> }): Promise<Response> {
  const { username } = await params;
  // card (default): the card itself, full artwork · og: 1200×630 social preview · sheet: spec-sheet poster
  const f = new URL(req.url).searchParams.get("format");
  const format = f === "og" || f === "sheet" ? f : "card";
  try {
    const card = await getCard(username);

    const res = await draw(card, format);
    // Store it in KV for 6h; worker.ts serves later requests from there without booting Next.js.
    const kv = await imagesKV();
    if (kv && res.status === 200) {
      const png = await res.clone().arrayBuffer();
      await kv.put(`${format}:${card.login.toLowerCase()}`, png, { expirationTtl: 21600 }).catch(() => {});
    }
    return res;
  } catch (e) {
    const status = e instanceof GitHubError ? e.status : 500;
    return new Response(e instanceof GitHubError ? e.message : "Could not render card", { status });
  }
}

async function draw(card: Awaited<ReturnType<typeof getCard>>, format: "og" | "card" | "sheet"): Promise<Response> {
    const [avatar, loaded] = await Promise.all([avatarDataUri(card.avatarUrl), fonts()]);
    // An empty list would replace next/og's built-in font, so only pass ours if they loaded.
    const fontList = loaded.length ? loaded : undefined;
    const headers = { "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400" };
    if (format === "og") {
      return new ImageResponse(<OgImage card={card} avatar={avatar} site={siteUrl()} />, {
        width: 1200,
        height: 630,
        fonts: fontList,
        headers,
      });
    }
    if (format === "sheet") {
      return new ImageResponse(<SpecPoster card={card} avatar={avatar} site={siteUrl()} />, { ...POSTER, fonts: fontList, headers });
    }
    const s = 2;
    return new ImageResponse(<CardShot card={card} avatar={avatar} s={s} />, { ...cardShotSize(card, s), fonts: fontList, headers });
}
