import { getCard, isValidUsername } from "@/lib/cards";
import { siteUrl } from "@/lib/site";
import { RARITY } from "@/lib/theme";

export const dynamic = "force-dynamic";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/**
 * GET /s/:username — the share link. Crawlers (X, Telegram, Slack…) read the preview tags here;
 * people are forwarded straight to the card page on the frontend.
 */
export async function GET(req: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const login = decodeURIComponent(username);
  const target = `${siteUrl()}/u/${encodeURIComponent(login)}`;
  if (!isValidUsername(login)) return Response.redirect(siteUrl(), 302);

  let title = `@${login} on Specsheet`;
  let description = "A collectible card computed from public GitHub activity.";
  try {
    const card = await getCard(login);
    title = `${card.name}: ${card.overall} ${card.role.name}`;
    description = `${RARITY[card.rarity].label} card · SHP ${card.stats.SHP} · CON ${card.stats.CON} · RNG ${card.stats.RNG} · DEP ${card.stats.DEP}`;
  } catch {
    /* still forward */
  }
  const image = `${new URL(req.url).origin}/api/card/${encodeURIComponent(login.toLowerCase())}/image?format=og`;
  const html = `<!doctype html><html><head><meta charset="utf-8">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Specsheet">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(target)}">
<meta property="og:image" content="${esc(image)}">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${esc(image)}">
<link rel="canonical" href="${esc(target)}">
<meta http-equiv="refresh" content="0;url=${esc(target)}">
</head><body><script>location.replace(${JSON.stringify(target)})</script>
<a href="${esc(target)}">Open ${esc(title)}</a></body></html>`;
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=300, s-maxage=3600" },
  });
}
