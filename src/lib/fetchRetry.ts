/** Fetch with a few retries: image renders can fail cold on the Workers free plan (CPU limit),
 *  and once one succeeds it's edge-cached, so a retry is usually enough. */
export async function fetchRetry(url: string, tries = 4): Promise<Response> {
  let last: Response | null = null;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return res;
      last = res;
    } catch {
      /* network blip */
    }
    await new Promise((r) => setTimeout(r, 600 * (i + 1)));
  }
  if (last) return last;
  throw new Error("failed");
}
