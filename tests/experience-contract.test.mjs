import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("production content is D1-backed with no static catalog fallback", async () => {
  const [manifest, composition, repository] = await Promise.all([
    readFile(".openai/hosting.json", "utf8"),
    readFile("app/composition/content.ts", "utf8"),
    readFile("app/infrastructure/d1-content-repository.ts", "utf8"),
  ]);
  assert.equal(JSON.parse(manifest).d1, "DB");
  assert.match(composition, /D1ContentRepository/);
  assert.match(repository, /env\.DB/);
  await assert.rejects(access("app/content/catalog.ts"));
  await assert.rejects(access("app/infrastructure/static-content-repository.ts"));
});

test("public content has no placeholder contacts or fake activity", async () => {
  const migration = await readFile("drizzle/0001_thin_argent.sql", "utf8");
  const projects = await readFile("app/projects/page.tsx", "utf8");
  assert.doesNotMatch(migration, /待公开|hello@example\.com|github\.com\/["']/i);
  assert.doesNotMatch(projects, /COMMITS|RELEASES|最近 12 周/);
  assert.match(projects, /Object\.entries\(snapshot\)/);
});

test("creative details remain discoverable and dismissible", async () => {
  const [experience, header] = await Promise.all([
    readFile("app/components/experience-layer.tsx", "utf8"),
    readFile("app/components/site-header.tsx", "utf8"),
  ]);
  assert.match(experience, /konamiSequence/);
  assert.match(experience, /aria-live="polite"/);
  assert.match(experience, /aria-label="关闭提示"/);
  assert.match(header, /data-easter-brand/);
  assert.match(header, /event\.key === "Escape"/);
});

test("theme control exposes two explicit states instead of an ambiguous indicator", async () => {
  const [component, css] = await Promise.all([
    readFile("app/components/theme-toggle.tsx", "utf8"),
    readFile("app/globals.css", "utf8"),
  ]);
  assert.match(component, /aria-label="使用浅色主题"/);
  assert.match(component, /aria-label="使用深色主题"/);
  assert.equal((component.match(/aria-pressed=/g) ?? []).length, 2);
  assert.doesNotMatch(component, /☼|☾/);
  assert.doesNotMatch(component, /<i\s*\/>/);
  assert.match(css, /\.theme-switch button\.is-active/);
});

test("playground turns real content relationships into a daily knowledge quest", async () => {
  const [page, constellation, migration] = await Promise.all([
    readFile("app/play/page.tsx", "utf8"),
    readFile("app/play/knowledge-constellation.tsx", "utf8"),
    readFile("drizzle/0006_knowledge_constellation.sql", "utf8"),
  ]);
  assert.match(page, /SiteShell active="play"/);
  assert.match(page, /contentServices\.articles\.list/);
  assert.match(constellation, /article\.tags/);
  assert.match(constellation, /knowledge-constellation:/);
  assert.match(constellation, /aria-live="polite"/);
  assert.match(constellation, /noiseBudget/);
  assert.match(constellation, /challenge\.edges/);
  assert.match(constellation, /href=\{`\/writing\//);
  assert.doesNotMatch(constellation, /Math\.random/);
  assert.match(migration, /knowledge-constellation/);
  assert.match(migration, /每日题目由当前内容图谱生成/);
  assert.match(migration, /json_set/);
});

test("the first-visit entrance is optional, replayable, and motion-safe", async () => {
  const [home, experience, css, migration] = await Promise.all([
    readFile("app/page.tsx", "utf8"),
    readFile("app/components/home-experience.tsx", "utf8"),
    readFile("app/globals.css", "utf8"),
    readFile("drizzle/0006_knowledge_constellation.sql", "utf8"),
  ]);
  assert.match(home, /HomeExperience/);
  assert.match(experience, /prefers-reduced-motion: reduce/);
  assert.match(experience, /role="dialog"/);
  assert.match(experience, /aria-modal="true"/);
  assert.match(experience, /event\.key === "Escape"/);
  assert.match(experience, /knowledge-garden-intro-v1/);
  assert.match(css, /\.home-replay/);
  assert.match(css, /\.entrance-sequence/);
  assert.match(migration, /replayLabel/);
});

test("mobile navigation isolates context and preserves keyboard control", async () => {
  const [header, css] = await Promise.all([
    readFile("app/components/site-header.tsx", "utf8"),
    readFile("app/globals.css", "utf8"),
  ]);
  assert.match(header, /menu-backdrop/);
  assert.match(header, /useOverlayEnvironment/);
  assert.match(header, /<OverlayLayer>/);
  assert.match(header, /event\.key === "Escape"/);
  assert.match(header, /event\.key === "Tab"/);
  assert.ok(header.includes('matchMedia("(min-width: 761px)")'));
  assert.match(css, /body\.menu-open\s*\{[^}]*overflow:\s*hidden/s);
});

test("viewport overlays escape filtered and transformed ancestors", async () => {
  const [search, header, entrance, confirmation, articlePage] = await Promise.all([
    readFile("app/components/search-palette.tsx", "utf8"),
    readFile("app/components/site-header.tsx", "utf8"),
    readFile("app/components/home-experience.tsx", "utf8"),
    readFile("app/studio/components/confirmation-dialog.tsx", "utf8"),
    readFile("app/writing/[slug]/page.tsx", "utf8"),
  ]);
  assert.match(search, /<OverlayLayer>/);
  assert.match(header, /<OverlayLayer>/);
  assert.match(entrance, /<OverlayLayer>/);
  assert.match(confirmation, /<OverlayLayer>/);
  assert.ok(articlePage.indexOf("<ReadingProgress") < articlePage.indexOf("<main"));
  assert.ok(articlePage.indexOf("<ReadingFocus") < articlePage.indexOf("<main"));
});

test("article navigation remains available below the desktop breakpoint", async () => {
  const [page, toc, css] = await Promise.all([
    readFile("app/writing/[slug]/page.tsx", "utf8"),
    readFile("app/components/article-toc.tsx", "utf8"),
    readFile("app/globals.css", "utf8"),
  ]);
  assert.match(page, /<ArticleToc sections=\{article\.sections\} compact/);
  assert.match(toc, /<details className="mobile-toc">/);
  assert.match(css, /\.mobile-toc\s*\{[^}]*display:\s*block/s);
});

test("discovery links resolve to the selected archive or project", async () => {
  const [explore, archive, discovery, projects] = await Promise.all([
    readFile("app/explore/page.tsx", "utf8"),
    readFile("app/writing/archive-browser.tsx", "utf8"),
    readFile("app/application/discovery-service.ts", "utf8"),
    readFile("app/projects/project-browser.tsx", "utf8"),
  ]);
  assert.match(explore, /\/writing\?year=\$\{year\}/);
  assert.match(archive, /initialYear/);
  assert.match(archive, /searchParams\.set\("year"/);
  assert.match(discovery, /\/projects#project-/);
  assert.match(projects, /id=\{`project-/);
});

test("local imagery does not require an optional transform binding", async () => {
  const [config, worker] = await Promise.all([
    readFile("next.config.ts", "utf8"),
    readFile("worker/index.ts", "utf8"),
  ]);
  assert.match(config, /unoptimized:\s*true/);
  assert.match(worker, /const images = env\.IMAGES/);
  assert.match(worker, /if \(!images\)/);
  assert.match(worker, /env\.ASSETS\.fetch/);
});
