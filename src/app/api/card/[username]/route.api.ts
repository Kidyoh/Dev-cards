import { boardRank, getCard } from "@/lib/cards";
import { GitHubError } from "@/lib/github";
import { json } from "@/lib/http";

export const dynamic = "force-dynamic";

/** GET /api/card/:username[?rescan=1] → CardData + boardRank ({ rank, total } | null). */
export async function GET(req: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const rescan = new URL(req.url).searchParams.get("rescan") === "1";
  try {
    const card = await getCard(decodeURIComponent(username), undefined, { rescan });
    const rank = await boardRank(card).catch(() => null);
    return json({ ...card, boardRank: rank }, { cache: rescan ? "no-store" : "public, max-age=60, s-maxage=600" });
  } catch (e) {
    const status = e instanceof GitHubError ? e.status : 500;
    return json({ error: e instanceof GitHubError ? e.message : "Unexpected error" }, { status });
  }
}
