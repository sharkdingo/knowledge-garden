import { env } from "cloudflare:workers";

export async function GET() {
  const checkedAt = new Date().toISOString();
  try {
    const result = await env.DB.prepare("SELECT 1 AS ready").first<{ ready: number }>();
    const ready = result?.ready === 1;
    return Response.json(
      { status: ready ? "ok" : "degraded", database: ready ? "ready" : "unavailable", checkedAt },
      {
        status: ready ? 200 : 503,
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch {
    return Response.json(
      { status: "degraded", database: "unavailable", checkedAt },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
