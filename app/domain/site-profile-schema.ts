import type { SiteProfile } from "./content";

export const SITE_PROFILE_SCHEMA_VERSION = 1;
export const LATEST_DATABASE_MIGRATION = "0021_article_draft_integrity.sql";

function record(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function parsePersistedSiteProfile(value: string): SiteProfile {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error("Invalid JSON in site profile.");
  }
  if (
    !record(parsed) ||
    parsed.schemaVersion !== SITE_PROFILE_SCHEMA_VERSION ||
    !record(parsed.identity) ||
    typeof parsed.identity.name !== "string" ||
    !Array.isArray(parsed.navigation) && "navigation" in parsed ||
    !record(parsed.hero) ||
    !record(parsed.home) ||
    !record(parsed.daily) ||
    !record(parsed.engagement) ||
    !record(parsed.pages) ||
    !record(parsed.about) ||
    !record(parsed.theme)
  ) {
    throw new Error("Site profile schema is invalid or unsupported.");
  }
  return parsed as unknown as SiteProfile;
}
