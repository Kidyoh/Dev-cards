/** Public URL of the site. SITE_URL is read at runtime (Cloudflare var); NEXT_PUBLIC_SITE_URL at build. */
export function siteUrl(): string {
  const env = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "";
  return (env || "http://localhost:3000").replace(/\/$/, "");
}
