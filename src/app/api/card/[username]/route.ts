import { NextResponse } from "next/server";
import { getCard } from "@/lib/cards";
import { GitHubError } from "@/lib/github";

export async function GET(_req: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  try {
    const card = await getCard(username);
    return NextResponse.json(card, {
      headers: { "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400" },
    });
  } catch (e) {
    const status = e instanceof GitHubError ? e.status : 500;
    const message = e instanceof GitHubError ? e.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status });
  }
}
