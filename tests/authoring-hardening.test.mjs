import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("all primary editors use optimistic concurrency with guarded relation writes", async () => {
  const [migration, articleRepository, problemRepository, projectEditor, articleEditor, problemEditor] =
    await Promise.all([
      readFile("drizzle/0018_editor_concurrency.sql", "utf8"),
      readFile("app/infrastructure/d1-studio-repository.ts", "utf8"),
      readFile("app/infrastructure/d1-algorithm-repository.ts", "utf8"),
      readFile("app/studio/projects/project-editor.tsx", "utf8"),
      readFile("app/studio/articles/article-editor.tsx", "utf8"),
      readFile("app/studio/problems/problem-editor.tsx", "utf8"),
    ]);
  assert.match(migration, /articles.*row_version/s);
  assert.match(migration, /algorithm_problems.*write_token/s);
  assert.match(migration, /projects.*row_version/s);
  assert.match(articleRepository, /write_token = \?/);
  assert.match(problemRepository, /write_token = \?/);
  for (const editor of [projectEditor, articleEditor, problemEditor]) {
    assert.match(editor, /"If-Match"/);
  }
});
test("Studio mutations enforce request boundaries and record privacy-safe audit events", async () => {
  const [request, auth, audit, articleRoute, categoryRoute] = await Promise.all([
    readFile("app/studio/studio-request.ts", "utf8"),
    readFile("app/studio/studio-auth.ts", "utf8"),
    readFile("app/infrastructure/structured-studio-audit-repository.ts", "utf8"),
    readFile("app/api/studio/articles/[slug]/route.ts", "utf8"),
    readFile("app/api/studio/categories/[id]/route.ts", "utf8"),
  ]);
  assert.match(request, /application\/json/);
  assert.match(request, /origin !== new URL\(request\.url\)\.origin/);
  assert.match(request, /assertStudioMutationRequest/);
  assert.match(auth, /authorized: true, user/);
  assert.match(audit, /SHA-256/);
  assert.doesNotMatch(audit, /actorEmail,\s*event/);
  assert.match(articleRoute, /assertStudioMutationRequest\(request\)/);
  assert.match(categoryRoute, /assertStudioMutationRequest\(request\)/);
});

test("backup restore is previewed, confirmed and protected by a restore point", async () => {
  const [service, repository, route, migration, page, workflow] = await Promise.all([
    readFile("app/application/studio-backup-service.ts", "utf8"),
    readFile("app/infrastructure/d1-studio-backup-repository.ts", "utf8"),
    readFile("app/api/studio/import/route.ts", "utf8"),
    readFile("drizzle/0019_safe_restore.sql", "utf8"),
    readFile("app/studio/backup/backup-manager.tsx", "utf8"),
    readFile(".github/workflows/ci.yml", "utf8"),
  ]);
  assert.match(service, /MAX_RESTORE_ROWS/);
  assert.match(service, /confirmationCode/);
  assert.match(service, /saveRestorePoint\(current\)/);
  assert.match(repository, /await d1\.batch\(statements\)/);
  assert.match(route, /mode === "preview"/);
  assert.match(migration, /CREATE TABLE `studio_restore_points`/);
  assert.match(page, /预演恢复/);
  assert.match(workflow, /npm run test:http/);
});

test("owner workflows do not misreport in-flight edits or destructive outcomes", async () => {
  const [
    articleEditor,
    problemEditor,
    projectEditor,
    siteEditor,
    categoryManager,
    backupManager,
    confirmationDialog,
    unsavedChanges,
    studioShell,
  ] = await Promise.all([
    readFile("app/studio/articles/article-editor.tsx", "utf8"),
    readFile("app/studio/problems/problem-editor.tsx", "utf8"),
    readFile("app/studio/projects/project-editor.tsx", "utf8"),
    readFile("app/studio/site/site-editor.tsx", "utf8"),
    readFile("app/studio/categories/category-manager.tsx", "utf8"),
    readFile("app/studio/backup/backup-manager.tsx", "utf8"),
    readFile("app/studio/components/confirmation-dialog.tsx", "utf8"),
    readFile("app/studio/components/unsaved-changes.tsx", "utf8"),
    readFile("app/studio/studio-shell.tsx", "utf8"),
  ]);

  for (const editor of [articleEditor, problemEditor, projectEditor, siteEditor]) {
    assert.match(editor, /aria-busy=\{saving\}/);
    assert.match(editor, /className="studio-editor-fields" disabled=\{saving\}/);
  }
  assert.match(categoryManager, /aria-busy=\{busy\}/);
  assert.match(categoryManager, /className="studio-category-form-fields" disabled=\{busy\}/);
  assert.doesNotMatch(`${categoryManager}\n${backupManager}`, /window\.confirm/);
  assert.match(backupManager, /安全点列表暂未刷新，重新打开页面即可查看/);
  assert.match(categoryManager, /<ConfirmationDialog/);
  assert.match(backupManager, /<ConfirmationDialog/);
  assert.match(confirmationDialog, /onCancelRef\.current\(\)/);
  assert.match(confirmationDialog, /busyRef\.current/);
  assert.match(unsavedChanges, /beforeunload/);
  assert.match(unsavedChanges, /onClickCapture/);
  assert.match(unsavedChanges, /放弃更改并离开/);
  assert.match(studioShell, /StudioUnsavedChangesBoundary/);
  assert.match(categoryManager, /但列表暂未刷新/);
});
