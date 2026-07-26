import { env } from "cloudflare:workers";

export async function GET() {
  const checkedAt = new Date().toISOString();
  try {
    const schema = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'site_settings'",
    ).first<{ name: string }>();
    if (schema?.name !== "site_settings") {
      return Response.json(
        { status: "degraded", database: "uninitialized", checkedAt },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }

    const profile = await env.DB.prepare(
      "SELECT key FROM site_settings WHERE key = 'profile'",
    ).first<{ key: string }>();
    const ready = profile?.key === "profile";
    return Response.json(
      {
        status: ready ? "ok" : "degraded",
        database: ready ? "ready" : "incomplete",
        checkedAt,
      },
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
