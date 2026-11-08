import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Pages are dynamic and cards are cached in D1, so no incremental cache is configured.
export default defineCloudflareConfig({});
