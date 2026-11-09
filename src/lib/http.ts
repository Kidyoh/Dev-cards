/** JSON helpers for the API routes. GETs are public, read-only data, so CORS is open. */
export const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export function json(data: unknown, init: { status?: number; cache?: string } = {}) {
  return new Response(JSON.stringify(data), {
    status: init.status ?? 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": init.cache ?? "no-store",
      ...CORS,
    },
  });
}
