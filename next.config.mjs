/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { remotePatterns: [{ protocol: "https", hostname: "avatars.githubusercontent.com" }] },
};
export default nextConfig;

// Lets `next dev` use the Cloudflare bindings (D1) from wrangler.jsonc.
if (process.env.NODE_ENV === "development" && !process.env.SPECSHEET_DEMO) {
  const { initOpenNextCloudflareForDev } = await import("@opennextjs/cloudflare");
  initOpenNextCloudflareForDev();
}
