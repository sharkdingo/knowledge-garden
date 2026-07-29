import { env } from "cloudflare:workers";
import {
  LATEST_DATABASE_MIGRATION,
  parsePersistedSiteProfile,
} from "../../domain/site-profile-schema";

export async function GET() {
  const checkedAt = new Date().toISOString();
  try {
    const requiredTables = [
      "site_settings",
      "navigation_items",
      "categories",
      "tags",
      "articles",
      "article_drafts",
      "article_revisions",
      "article_reactions",
      "article_sections",
      "article_tags",
      "projects",
      "algorithm_problems",
      "algorithm_solutions",
      "algorithm_code_blocks",
      "algorithm_references",
      "algorithm_problem_tags",
      "studio_restore_points",
      "d1_migrations",
    ];
    const placeholders = requiredTables.map(() => "?").join(", ");
    const [tablesResult, migrationResult, profileResult] = await env.DB.batch([
      env.DB.prepare(
        `SELECT name FROM sqlite_master WHERE type = 'table' AND name IN (${placeholders})`,
      ).bind(...requiredTables),
      env.DB.prepare("SELECT name FROM d1_migrations ORDER BY id DESC LIMIT 1"),
      env.DB.prepare("SELECT value FROM site_settings WHERE key = 'profile'"),
    ]);
    const found = new Set((tablesResult.results ?? []).map((row) => String(row.name)));
    if (requiredTables.some((table) => !found.has(table))) {
      return Response.json(
        { status: "degraded", database: "uninitialized", checkedAt },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }

    const migration = migrationResult.results?.[0] as { name?: string } | undefined;
    const profile = profileResult.results?.[0] as { value?: string } | undefined;
    const migrationReady = migration?.name === LATEST_DATABASE_MIGRATION;
    if (!profile?.value) throw new Error("Missing site profile");
    parsePersistedSiteProfile(profile.value);
    const ready = migrationReady;
    return Response.json(
      {
        status: ready ? "ok" : "degraded",
        database: ready ? "ready" : "migration-pending",
        migration: migration?.name ?? null,
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
