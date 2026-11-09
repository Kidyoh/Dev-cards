import { getBoard } from "@/lib/cards";
import { GitHubError } from "@/lib/github";
import { json } from "@/lib/http";

export const dynamic = "force-dynamic";

/** GET /api/board[?lang=Go] → { cards: CardData[] } (Ethiopia only, scanned developers). */
export async function GET(req: Request) {
  const lang = new URL(req.url).searchParams.get("lang") ?? undefined;
  try {
    const cards = await getBoard(lang || undefined);
    return json({ cards }, { cache: "public, max-age=30, s-maxage=60" });
  } catch (e) {
    const status = e instanceof GitHubError ? e.status : 500;
    return json({ error: e instanceof GitHubError ? e.message : "Unexpected error" }, { status });
  }
}
