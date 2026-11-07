import { ImageResponse } from "next/og";
import { getCard } from "@/lib/cards";
import { GitHubError } from "@/lib/github";
import { avatarDataUri, CardOrSlab, cardSize, fonts, OgImage } from "@/lib/render";
import { siteUrl } from "@/lib/site";

export const runtime = "nodejs";

export async function GET(req: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const format = new URL(req.url).searchParams.get("format") === "og" ? "og" : "card";
  try {
    const card = await getCard(username);
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
    const s = 2;
    const size = cardSize(card, s);
    return new ImageResponse(
      (
        <div style={{ display: "flex", width: size.width, height: size.height }}>
          <CardOrSlab card={card} avatar={avatar} s={s} />
        </div>
      ),
      { ...size, fonts: fontList, headers },
    );
  } catch (e) {
    const status = e instanceof GitHubError ? e.status : 500;
    return new Response(e instanceof GitHubError ? e.message : "Could not render card", { status });
  }
}
