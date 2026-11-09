/**
 * One codebase, two deployments:
 *   SPECSHEET_TARGET=web → static export for Vercel (pages only, no server code, no functions)
 *   SPECSHEET_TARGET=api → Cloudflare Worker via OpenNext (API routes only: *.api.ts / *.api.tsx)
 *   unset (local dev)    → both, so `npm run dev` runs the whole app on one port
 */
const target = process.env.SPECSHEET_TARGET ?? "all";

const pageExtensions =
  target === "web" ? ["tsx", "ts"] : target === "api" ? ["api.ts", "api.tsx"] : ["api.ts", "api.tsx", "tsx", "ts"];

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions,
  ...(target === "web" ? { output: "export", trailingSlash: false, images: { unoptimized: true } } : {}),
  ...(target !== "web"
    ? {
        images: { remotePatterns: [{ protocol: "https", hostname: "avatars.githubusercontent.com" }] },
        // local dev: same URL shape as Vercel (/u/<name> is served by the /u page)
        async rewrites() {
          return [{ source: "/u/:user", destination: "/u" }];
        },
      }
    : {}),
};
export default nextConfig;

// Lets `next dev` use the Cloudflare bindings (D1, KV) from wrangler.jsonc.
if (process.env.NODE_ENV === "development" && !process.env.SPECSHEET_DEMO) {
  const { initOpenNextCloudflareForDev } = await import("@opennextjs/cloudflare");
  initOpenNextCloudflareForDev();
}
