import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Studio API errors have one safe presentation boundary", async () => {
  const [responseBoundary, validation, articleRoute, projectRoute, siteRoute] =
    await Promise.all([
      readFile("app/studio/studio-response.ts", "utf8"),
      readFile("app/application/studio-validation.ts", "utf8"),
      readFile("app/api/studio/articles/[slug]/route.ts", "utf8"),
      readFile("app/api/studio/projects/[id]/route.ts", "utf8"),
      readFile("app/api/studio/site/route.ts", "utf8"),
    ]);

  assert.match(responseBoundary, /error instanceof StudioConflictError/);
  assert.match(responseBoundary, /error instanceof StudioValidationError/);
  assert.match(responseBoundary, /status: 409/);
  assert.match(responseBoundary, /status: options\.validationStatus \?\? 400/);
  assert.match(responseBoundary, /\{ error: fallbackMessage \}.*status: 500/s);
  assert.doesNotMatch(
    responseBoundary,
    /error instanceof Error \? error\.message/,
  );
  assert.match(responseBoundary, /headers\.set\("Cache-Control", "no-store"\)/);
  assert.match(validation, /this\.name = "StudioValidationError"/);

  for (const route of [articleRoute, projectRoute, siteRoute]) {
    assert.match(route, /studioErrorResponse/);
    assert.doesNotMatch(route, /error instanceof Error \? error\.message/);
  }
});

test("site settings and reaction cleanup share the same optimistic transaction", async () => {
  const repository = await readFile(
    "app/infrastructure/d1-studio-repository.ts",
    "utf8",
  );
  const method = repository.slice(
    repository.indexOf("async updateEditableSiteSettings"),
  );

  assert.match(method, /const \[, updateResult\] = await d1\.batch\(\[/);
  assert.match(method, /DELETE FROM article_reactions/);
  assert.match(method, /WHERE key = 'profile' AND updated_at = \?/);
  assert.match(method, /UPDATE site_settings/);
  assert.match(method, /if \(!updateResult\.meta\.changes\) return null/);
  assert.doesNotMatch(method, /updateEditableSiteSettings[\s\S]*?\.run\(\)/);
});
