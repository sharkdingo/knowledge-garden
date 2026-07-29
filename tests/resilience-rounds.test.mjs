import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("article saves keep content, recovery and revision retention in one guarded batch", async () => {
  const [service, repository] = await Promise.all([
    readFile("app/application/studio-article-service.ts", "utf8"),
    readFile("app/infrastructure/d1-studio-repository.ts", "utf8"),
  ]);
  const update = repository.slice(
    repository.indexOf("async updateStudioArticle"),
    repository.indexOf("private prepareRevision"),
  );
  const updateService = service.slice(
    service.indexOf("async update("),
    service.indexOf("async archive("),
  );

  assert.match(update, /DELETE FROM article_drafts/);
  assert.match(update, /DELETE FROM article_revisions/);
  assert.match(update, /write_token = \?/);
  assert.match(update, /LIMIT 30/);
  assert.doesNotMatch(
    update.slice(update.indexOf("if (!results[0].meta.changes)")),
    /await d1\.prepare/,
  );
  assert.doesNotMatch(updateService, /deleteStudioArticleDraft/);
});

test("stale article and algorithm writes cannot create unattached tags", async () => {
  const [articles, algorithms] = await Promise.all([
    readFile("app/infrastructure/d1-studio-repository.ts", "utf8"),
    readFile("app/infrastructure/d1-algorithm-repository.ts", "utf8"),
  ]);

  assert.match(articles, /private prepareArticleRelations\(/);
  assert.doesNotMatch(articles, /private async prepareArticleRelations/);
  assert.match(
    articles,
    /INSERT OR IGNORE INTO tags[\s\S]*?WHERE EXISTS[\s\S]*?write_token = \?/,
  );
  assert.match(
    algorithms,
    /INSERT OR IGNORE INTO tags[\s\S]*?WHERE \$\{guard\}/,
  );
});

test("category deletion has atomic and explicit domain outcomes", async () => {
  const [domain, service, repository] = await Promise.all([
    readFile("app/domain/studio.ts", "utf8"),
    readFile("app/application/studio-category-service.ts", "utf8"),
    readFile("app/infrastructure/d1-studio-repository.ts", "utf8"),
  ]);

  assert.match(domain, /"deleted" \| "in-use" \| "missing"/);
  assert.match(repository, /deleteStudioCategory[\s\S]*?await d1\.batch\(\[/);
  assert.match(repository, /DELETE FROM categories[\s\S]*?NOT EXISTS/);
  assert.match(service, /result === "in-use"/);
  assert.match(service, /result === "missing"/);
});

test("all Studio clients share recoverable network and response handling", async () => {
  const [client, editors] = await Promise.all([
    readFile("app/studio/studio-client.ts", "utf8"),
    Promise.all([
      "app/studio/articles/article-editor.tsx",
      "app/studio/problems/problem-editor.tsx",
      "app/studio/projects/project-editor.tsx",
      "app/studio/site/site-editor.tsx",
      "app/studio/categories/category-manager.tsx",
      "app/studio/backup/backup-manager.tsx",
    ].map((path) => readFile(path, "utf8"))),
  ]);

  assert.match(client, /网络连接中断/);
  assert.match(client, /response\.status === 401/);
  assert.match(client, /服务暂时无法返回有效结果/);
  assert.match(client, /error\.name === "AbortError"/);
  for (const editor of editors) {
    assert.match(editor, /studioRequest/);
    assert.doesNotMatch(editor, /\bfetch\(/);
    assert.doesNotMatch(editor, /response\.json\(/);
  }
});

test("search fields expose programmatic names beyond visual placeholders", async () => {
  const [globalSearch, problemArchive] = await Promise.all([
    readFile("app/components/search-palette.tsx", "utf8"),
    readFile("app/problems/problem-archive.tsx", "utf8"),
  ]);

  assert.match(globalSearch, /className="sr-only">搜索文章、题解与项目/);
  assert.match(problemArchive, /className="sr-only">\{config\.searchPlaceholder\}/);
});
