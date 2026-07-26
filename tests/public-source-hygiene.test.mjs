import assert from "node:assert/strict";
import { glob, readFile } from "node:fs/promises";
import test from "node:test";

async function migrationSource() {
  const files = [];
  for await (const file of glob("drizzle/*.sql")) files.push(file);
  return (await Promise.all(files.sort().map((file) => readFile(file, "utf8")))).join("\n");
}

test("public migrations contain capabilities and configuration but no preset content", async () => {
  const source = await migrationSource();
  const contentTables = [
    "articles",
    "article_sections",
    "article_tags",
    "categories",
    "tags",
    "projects",
    "algorithm_problems",
    "algorithm_solutions",
    "algorithm_code_blocks",
    "algorithm_problem_tags",
    "algorithm_references",
  ];
  for (const table of contentTables) {
    assert.doesNotMatch(source, new RegExp(`INSERT INTO \`${table}\``));
  }
  assert.doesNotMatch(source, /INSERT INTO `site_editors`/);
  assert.doesNotMatch(source, /@qq\.com/i);
  assert.match(source, /\$\.identity\.shortName', 'sharkdingo'/);
  assert.match(source, /DROP TABLE `site_editors`/);
});

test("editor identity is runtime-only and public empty states cover every content surface", async () => {
  const [access, home, writing, projects, explore, play, studio] = await Promise.all([
    readFile("app/infrastructure/environment-studio-access-repository.ts", "utf8"),
    readFile("app/page.tsx", "utf8"),
    readFile("app/writing/archive-browser.tsx", "utf8"),
    readFile("app/projects/project-browser.tsx", "utf8"),
    readFile("app/explore/explore-browser.tsx", "utf8"),
    readFile("app/play/knowledge-constellation.tsx", "utf8"),
    readFile("app/studio/page.tsx", "utf8"),
  ]);
  assert.match(access, /STUDIO_EDITOR_EMAILS/);
  assert.doesNotMatch(access, /@/);
  for (const source of [home, writing, projects, explore, play]) {
    assert.match(source, /content-empty-state|ContentEmptyState/);
  }
  assert.match(studio, /还没有内容记录/);
});
