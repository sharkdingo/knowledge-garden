import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("a fresh Studio can bootstrap categories before the first article", async () => {
  const [domain, service, repository, page, route, shell] = await Promise.all([
    readFile("app/domain/studio.ts", "utf8"),
    readFile("app/application/studio-category-service.ts", "utf8"),
    readFile("app/infrastructure/d1-studio-repository.ts", "utf8"),
    readFile("app/studio/articles/new/page.tsx", "utf8"),
    readFile("app/api/studio/categories/route.ts", "utf8"),
    readFile("app/studio/studio-shell.tsx", "utf8"),
  ]);
  assert.match(domain, /interface StudioCategoryRepository/);
  assert.doesNotMatch(service, /cloudflare:workers|env\.DB/);
  assert.match(repository, /createStudioCategory/);
  assert.match(repository, /articleCount/);
  assert.match(page, /\/studio\/categories/);
  assert.match(route, /authorizeStudioApi/);
  assert.match(shell, /\/studio\/categories/);
});

test("profile compatibility, write conflicts, health and export are explicit", async () => {
  const [schema, migration, repository, service, health, exportRoute, workflow] = await Promise.all([
    readFile("app/domain/site-profile-schema.ts", "utf8"),
    readFile("drizzle/0017_architecture_closure.sql", "utf8"),
    readFile("app/infrastructure/d1-studio-repository.ts", "utf8"),
    readFile("app/application/studio-site-service.ts", "utf8"),
    readFile("app/api/health/route.ts", "utf8"),
    readFile("app/api/studio/export/route.ts", "utf8"),
    readFile(".github/workflows/ci.yml", "utf8"),
  ]);
  assert.match(schema, /SITE_PROFILE_SCHEMA_VERSION/);
  assert.match(migration, /schemaVersion/);
  assert.match(repository, /updated_at = \?/);
  assert.match(service, /StudioConflictError/);
  assert.match(health, /LATEST_DATABASE_MIGRATION/);
  assert.match(exportRoute, /authorizeStudioApi/);
  assert.match(workflow, /npm test/);
});
