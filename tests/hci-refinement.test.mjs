import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("search remains predictable and announced when the result set is empty", async () => {
  const palette = await readFile("app/components/search-palette.tsx", "utf8");

  assert.match(palette, /results\.length\s*\?\s*Math\.min/);
  assert.match(palette, /:\s*0\);/);
  assert.match(palette, /aria-autocomplete="list"/);
  assert.match(palette, /aria-describedby="search-palette-summary"/);
  assert.match(palette, /id="search-palette-summary"/);
  assert.match(palette, /aria-busy=\{indexState === "loading"\}/);
});

test("the home page does not repeat the same article as a second starting card", async () => {
  const home = await readFile("app/page.tsx", "utf8");

  assert.doesNotMatch(home, /startingArticle/);
  assert.doesNotMatch(home, /start-writing/);
  assert.match(home, /home-latest/);
  assert.match(home, /<DailySignal/);
});

test("archive empty states are supplied by managed page content", async () => {
  const [writingPage, writingBrowser, projectPage, projectBrowser] = await Promise.all([
    readFile("app/writing/page.tsx", "utf8"),
    readFile("app/writing/archive-browser.tsx", "utf8"),
    readFile("app/projects/page.tsx", "utf8"),
    readFile("app/projects/project-browser.tsx", "utf8"),
  ]);

  assert.match(writingPage, /emptyState=\{intro\}/);
  assert.match(projectPage, /emptyState=\{intro\}/);
  assert.match(writingBrowser, /emptyState\.eyebrow/);
  assert.match(projectBrowser, /emptyState\.description/);
  assert.doesNotMatch(writingBrowser, /还没有发布文章/);
  assert.doesNotMatch(projectBrowser, /还没有公开项目/);
});

test("projects and Studio use explicit onward paths instead of dashboard-only cards", async () => {
  const [projects, studio, styles] = await Promise.all([
    readFile("app/projects/project-browser.tsx", "utf8"),
    readFile("app/studio/articles/page.tsx", "utf8"),
    readFile("app/globals.css", "utf8"),
  ]);

  assert.match(projects, /project-card-visual/);
  assert.match(projects, /project-card-copy/);
  assert.match(studio, /href=\{`\/writing\/\$\{article\.slug\}`\}/);
  assert.match(studio, />\s*查看\s*</);
  assert.match(styles, /\.search-trigger\s*\{[^}]*border-bottom: 1px solid var\(--line\)/s);
  assert.match(styles, /\.article-engagement\s*\{[^}]*background: transparent/s);
  assert.match(styles, /\.project-card\s*\{[^}]*display: grid[^}]*grid-template-columns:/s);
  assert.match(styles, /@media \(max-width: 760px\)[\s\S]*?\.project-card\s*\{[^}]*grid-template-columns: 1fr/s);
});
