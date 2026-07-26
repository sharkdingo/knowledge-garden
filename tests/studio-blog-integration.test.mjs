import assert from "node:assert/strict";
import { glob, readFile } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

async function migratedDatabase() {
  const database = new DatabaseSync(":memory:");
  database.exec("PRAGMA foreign_keys = ON");
  const migrations = [];
  for await (const file of glob("drizzle/*.sql")) migrations.push(file);
  for (const file of migrations.sort()) {
    const migration = await readFile(file, "utf8");
    for (const statement of migration.split("--> statement-breakpoint")) {
      if (statement.trim()) database.exec(statement);
    }
  }
  return database;
}

test("Studio article lifecycle and public visibility use the same D1 records", async () => {
  const database = await migratedDatabase();
  database.prepare(
    "INSERT INTO categories (id, name, description, sort_order) VALUES ('integration', 'Integration', 'Integration tests', 0)",
  ).run();
  const categoryId = database.prepare("SELECT id FROM categories LIMIT 1").get().id;
  database.prepare(`
    INSERT INTO articles (
      slug, title, summary, published_at, display_date, category_id, minutes,
      featured, lead, quote, callout_label, callout_lines, status
    ) VALUES (
      'studio-public-contract', 'Contract', 'Summary', '2099-01-01T00:00:00Z',
      '2099.01.01', ?, 5, 0, 'Lead', NULL, NULL, NULL, 'draft'
    )
  `).run(categoryId);
  database.prepare(`
    INSERT INTO article_sections (
      article_slug, section_id, title, paragraphs, sort_order
    ) VALUES (
      'studio-public-contract', 'start', 'Start', '["Body"]', 0
    )
  `).run();

  const visible = () => database.prepare(`
    SELECT slug
    FROM articles
    WHERE slug = 'studio-public-contract'
      AND (
        status = 'published'
        OR (status = 'scheduled' AND datetime(published_at) <= datetime('now'))
      )
  `).get();

  assert.equal(visible(), undefined, "drafts must stay private");
  database.prepare(`
    UPDATE articles SET status = 'published'
    WHERE slug = 'studio-public-contract'
  `).run();
  assert.equal(visible().slug, "studio-public-contract", "published work must be public");
  database.prepare(`
    UPDATE articles SET status = 'archived'
    WHERE slug = 'studio-public-contract'
  `).run();
  assert.equal(visible(), undefined, "archived work must leave public routes");
  database.prepare(`
    UPDATE articles
    SET status = 'scheduled', published_at = '2099-01-01T00:00:00Z'
    WHERE slug = 'studio-public-contract'
  `).run();
  assert.equal(visible(), undefined, "future scheduled work must stay private");
  database.prepare(`
    UPDATE articles
    SET published_at = '2020-01-01T00:00:00Z'
    WHERE slug = 'studio-public-contract'
  `).run();
  assert.equal(visible().slug, "studio-public-contract", "due scheduled work must become public");
  assert.deepEqual(database.prepare("PRAGMA foreign_key_check").all(), []);
});

test("public content routes always read current D1 state", async () => {
  const routes = [
    "app/about/page.tsx",
    "app/explore/page.tsx",
    "app/play/page.tsx",
    "app/problems/page.tsx",
    "app/problems/[slug]/page.tsx",
    "app/projects/page.tsx",
    "app/writing/page.tsx",
    "app/writing/[slug]/page.tsx",
    "app/feed.xml/route.ts",
    "app/sitemap.ts",
    "app/robots.ts",
  ];
  for (const route of routes) {
    const source = await readFile(route, "utf8");
    assert.match(source, /export const dynamic = "force-dynamic"/, `${route} may serve stale content`);
  }
});

test("article reading and authoring close the owner-to-visitor loop", async () => {
  const [composition, publicRepository, articleService, page, editor, archive, api] =
    await Promise.all([
      readFile("app/composition/content.ts", "utf8"),
      readFile("app/infrastructure/d1-content-repository.ts", "utf8"),
      readFile("app/application/article-service.ts", "utf8"),
      readFile("app/writing/[slug]/page.tsx", "utf8"),
      readFile("app/studio/articles/article-editor.tsx", "utf8"),
      readFile("app/writing/archive-browser.tsx", "utf8"),
      readFile("app/api/studio/articles/[slug]/route.ts", "utf8"),
    ]);
  assert.match(composition, /StudioArticleService/);
  assert.match(composition, /ArticleService/);
  assert.match(publicRepository, /WHERE a\.slug = \?/);
  assert.match(publicRepository, /a\.status = 'published'/);
  assert.match(articleService, /getReadingView/);
  assert.match(page, /getReadingView/);
  assert.doesNotMatch(page, /getJourney\(slug\)/);
  assert.match(editor, /查看公开文章/);
  assert.match(editor, /nextSectionId/);
  assert.match(archive, /searchTokens/);
  assert.match(api, /authorizeStudioApi/);
});

test("public and Studio routes expose complete navigation and safe fallbacks", async () => {
  const [siteShell, studioShell, writing, studioArticles, notFound, error] =
    await Promise.all([
      readFile("app/components/site-shell.tsx", "utf8"),
      readFile("app/studio/studio-shell.tsx", "utf8"),
      readFile("app/writing/page.tsx", "utf8"),
      readFile("app/studio/articles/page.tsx", "utf8"),
      readFile("app/not-found.tsx", "utf8"),
      readFile("app/error.tsx", "utf8"),
    ]);
  assert.match(siteShell, /profile\.navigation/);
  for (const route of ["/studio/articles", "/studio/problems", "/studio/projects", "/studio/site"]) {
    assert.match(studioShell, new RegExp(route.replaceAll("/", "\\/")));
  }
  assert.match(writing, /key=\{`\$\{selectedCategory\}/);
  assert.match(studioArticles, /还没有文章/);
  assert.match(notFound, /返回首页/);
  assert.match(error, /重新尝试|重试/);
});
