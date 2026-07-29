import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Studio write access is authenticated and authorized from runtime configuration", async () => {
  const [auth, articleRoute, siteRoute, requestReader, accessRepository, migration] = await Promise.all([
    readFile("app/studio/studio-auth.ts", "utf8"),
    readFile("app/api/studio/articles/route.ts", "utf8"),
    readFile("app/api/studio/site/route.ts", "utf8"),
    readFile("app/studio/studio-request.ts", "utf8"),
    readFile("app/infrastructure/environment-studio-access-repository.ts", "utf8"),
    readFile("drizzle/0005_material_zemo.sql", "utf8"),
  ]);
  assert.match(auth, /requireChatGPTUser/);
  assert.match(auth, /canEdit\(user\.email\)/);
  assert.match(articleRoute, /authorizeStudioApi/);
  assert.match(articleRoute, /readStudioJson/);
  assert.match(siteRoute, /authorizeStudioApi/);
  assert.match(siteRoute, /readStudioJson/);
  assert.match(requestReader, /请求内容不是有效的 JSON/);
  assert.match(requestReader, /请求内容必须是一个对象/);
  assert.match(accessRepository, /STUDIO_EDITOR_EMAILS/);
  assert.doesNotMatch(accessRepository, /@/);
  assert.match(migration, /CREATE TABLE `site_editors`/);
  assert.doesNotMatch(migration, /INSERT INTO `site_editors`/);
});

test("Studio follows the application boundary instead of writing D1 from pages", async () => {
  const [composition, repository, editor, siteEditor] = await Promise.all([
    readFile("app/composition/content.ts", "utf8"),
    readFile("app/infrastructure/d1-studio-repository.ts", "utf8"),
    readFile("app/studio/articles/article-editor.tsx", "utf8"),
    readFile("app/studio/site/site-editor.tsx", "utf8"),
  ]);
  assert.match(composition, /StudioArticleService/);
  assert.match(composition, /D1StudioRepository/);
  assert.match(repository, /env\.DB/);
  assert.doesNotMatch(editor, /env\.DB|cloudflare:workers/);
  assert.doesNotMatch(siteEditor, /env\.DB|cloudflare:workers/);
});

test("article editing protects work and uses recoverable lifecycle actions", async () => {
  const [editor, dialog, service, repository] = await Promise.all([
    readFile("app/studio/articles/article-editor.tsx", "utf8"),
    readFile("app/studio/components/confirmation-dialog.tsx", "utf8"),
    readFile("app/application/studio-article-service.ts", "utf8"),
    readFile("app/infrastructure/d1-studio-repository.ts", "utf8"),
  ]);
  assert.match(editor, /beforeunload/);
  assert.match(editor, /localStorage/);
  assert.match(editor, /studio-live-preview/);
  assert.match(dialog, /role="alertdialog"/);
  assert.match(editor, /有未保存更改/);
  assert.match(service, /Slug 不能直接修改/);
  assert.match(repository, /status = 'archived'/);
  assert.match(repository, /d1\.batch/);
});

test("projects have an authenticated D1-backed management loop", async () => {
  const [route, service, repository, editor, shell] = await Promise.all([
    readFile("app/api/studio/projects/route.ts", "utf8"),
    readFile("app/application/studio-project-service.ts", "utf8"),
    readFile("app/infrastructure/d1-studio-repository.ts", "utf8"),
    readFile("app/studio/projects/project-editor.tsx", "utf8"),
    readFile("app/studio/studio-shell.tsx", "utf8"),
  ]);
  assert.match(route, /authorizeStudioApi/);
  assert.match(service, /StudioProjectRepository/);
  assert.match(repository, /createStudioProject/);
  assert.match(repository, /archiveStudioProject/);
  assert.match(editor, /ProjectVisual/);
  assert.match(shell, /\/studio\/projects/);
});

test("Studio remains operable on mobile and exposes reversible actions", async () => {
  const [css, shell, articleEditor, projectEditor] = await Promise.all([
    readFile("app/globals.css", "utf8"),
    readFile("app/studio/studio-shell.tsx", "utf8"),
    readFile("app/studio/articles/article-editor.tsx", "utf8"),
    readFile("app/studio/projects/project-editor.tsx", "utf8"),
  ]);
  assert.match(css, /\.studio-mobile-actions/);
  assert.match(shell, /查看网站/);
  assert.match(shell, /退出/);
  assert.match(articleEditor, /恢复为草稿/);
  assert.match(projectEditor, /恢复项目/);
});

test("site experience configuration remains D1-backed", async () => {
  const [siteService, repository, migration] = await Promise.all([
    readFile("app/application/studio-site-service.ts", "utf8"),
    readFile("app/infrastructure/d1-studio-repository.ts", "utf8"),
    readFile("drizzle/0005_material_zemo.sql", "utf8"),
  ]);
  assert.match(siteService, /introDuration/);
  assert.match(siteService, /darkAccent/);
  assert.match(repository, /UPDATE site_settings/);
  assert.match(repository, /daily: settings\.daily/);
  assert.match(migration, /\$\.hero\.intro/);
});

test("Studio has durable autosave, revision restore, and scheduled publishing", async () => {
  const [editor, service, repository, draftRoute, revisionRoute, migration, publicRepository] = await Promise.all([
    readFile("app/studio/articles/article-editor.tsx", "utf8"),
    readFile("app/application/studio-article-service.ts", "utf8"),
    readFile("app/infrastructure/d1-studio-repository.ts", "utf8"),
    readFile("app/api/studio/articles/[slug]/draft/route.ts", "utf8"),
    readFile("app/api/studio/articles/[slug]/revisions/route.ts", "utf8"),
    readFile("drizzle/0010_young_magik.sql", "utf8"),
    readFile("app/infrastructure/d1-content-repository.ts", "utf8"),
  ]);
  assert.match(editor, /1400/);
  assert.match(editor, /正在自动备份/);
  assert.match(editor, /版本历史/);
  assert.match(editor, /定时发布/);
  assert.match(service, /saveStudioArticleDraft/);
  assert.match(service, /reason = "scheduled"/);
  assert.match(service, /revisionId: string,\s+expectedVersion: number/);
  assert.match(repository, /article_revisions/);
  assert.match(repository, /ON CONFLICT\(article_slug\) DO UPDATE/);
  assert.match(repository, /LIMIT 30/);
  assert.match(draftRoute, /authorizeStudioApi/);
  assert.match(revisionRoute, /authorizeStudioApi/);
  assert.match(revisionRoute, /articles\.restore/);
  assert.match(migration, /CREATE TABLE `article_drafts`/);
  assert.match(migration, /CREATE TABLE `article_revisions`/);
  assert.match(publicRepository, /a\.status = 'scheduled'/);
  assert.match(publicRepository, /datetime\(a\.published_at\) <= datetime\('now'\)/);
});
