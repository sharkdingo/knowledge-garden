import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("visitors can search globally from every public route", async () => {
  const [shell, header, palette, overlay, ranking, discovery] = await Promise.all([
    readFile("app/components/site-shell.tsx", "utf8"),
    readFile("app/components/site-header.tsx", "utf8"),
    readFile("app/components/search-palette.tsx", "utf8"),
    readFile("app/components/overlay-layer.tsx", "utf8"),
    readFile("app/domain/search.ts", "utf8"),
    readFile("app/application/discovery-service.ts", "utf8"),
  ]);
  assert.match(shell, /discovery\.buildSearchIndex/);
  assert.match(header, /SearchPalette/);
  assert.match(palette, /Control\+K|metaKey \|\| event\.ctrlKey/);
  assert.match(palette, /role="combobox"/);
  assert.match(palette, /role="listbox"/);
  assert.match(palette, /aria-activedescendant/);
  assert.match(palette, /event\.key === "Escape"/);
  assert.match(palette, /event\.key === "Tab"/);
  assert.match(palette, /<OverlayLayer>/);
  assert.match(palette, /isolate: "\.site-root"/);
  assert.match(overlay, /createPortal\(children, document\.body\)/);
  assert.match(overlay, /isolated\.inert = true/);
  assert.match(overlay, /body\.style\.position = "fixed"/);
  assert.match(palette, /search-palette-filters/);
  assert.match(palette, /knowledge-garden-recent-searches-v1/);
  assert.match(palette, /<Highlighted/);
  assert.match(ranking, /rankSearchEntries/);
  assert.match(ranking, /tokens\.every/);
  assert.match(discovery, /section\.paragraphs/);
});

test("the home page provides explicit starting paths from real content", async () => {
  const [home, migration] = await Promise.all([
    readFile("app/page.tsx", "utf8"),
    readFile("drizzle/0007_visitor_journey.sql", "utf8"),
  ]);
  assert.match(home, /home-start/);
  assert.match(home, /taxonomy\.categories/);
  assert.match(home, /startingProject/);
  assert.match(home, /ContinueReading/);
  assert.match(migration, /\$\.home/);
  assert.match(migration, /START HERE/);
});

test("reading progress enables private same-device continuity", async () => {
  const [progress, continuation, focus] = await Promise.all([
    readFile("app/components/reading-progress.tsx", "utf8"),
    readFile("app/components/continue-reading.tsx", "utf8"),
    readFile("app/components/reading-focus.tsx", "utf8"),
  ]);
  assert.match(progress, /knowledge-garden-reading-v1|READING_HISTORY_KEY/);
  assert.match(progress, /Math\.max\(previous\?\.progress/);
  assert.match(continuation, /progress > 3 && item\.progress < 96/);
  assert.doesNotMatch(continuation, /env\.DB|cloudflare:workers/);
  assert.match(progress, /resumeProgress/);
  assert.match(progress, /继续上次阅读/);
  assert.match(focus, /knowledge-garden-reading-preferences-v1/);
  assert.match(focus, /data.*reading|dataset\.readingSize/);
  assert.match(focus, /aria-label="阅读排版设置"/);
});

test("stale deployment chunks recover once without a reload loop", async () => {
  const [layout, recovery] = await Promise.all([
    readFile("app/layout.tsx", "utf8"),
    readFile("app/components/deployment-recovery.tsx", "utf8"),
  ]);
  assert.match(layout, /<DeploymentRecovery/);
  assert.match(recovery, /failed to fetch dynamically imported module/i);
  assert.match(recovery, /sessionStorage/);
  assert.match(recovery, /Date\.now\(\) - previous < 60_000/);
  assert.match(recovery, /window\.location\.reload/);
});

test("articles expose onward paths and a resilient share action", async () => {
  const [page, service, actions] = await Promise.all([
    readFile("app/writing/[slug]/page.tsx", "utf8"),
    readFile("app/application/article-service.ts", "utf8"),
    readFile("app/components/article-actions.tsx", "utf8"),
  ]);
  assert.match(page, /related-reading/);
  assert.match(page, /article-sequence/);
  assert.match(service, /sharedTags/);
  assert.match(service, /getJourney/);
  assert.match(actions, /navigator\.share/);
  assert.match(actions, /navigator\.clipboard/);
  assert.match(actions, /AbortError/);
});
