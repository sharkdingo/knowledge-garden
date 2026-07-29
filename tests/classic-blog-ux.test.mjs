import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("the home page exposes the current writing stream before optional experiences", async () => {
  const home = await readFile("app/page.tsx", "utf8");
  assert.match(home, /const latestArticles = articles\.slice\(0, 5\)/);
  assert.match(home, /profile\.pages\.writing\.description/);
  assert.ok(
    home.indexOf("home-latest") < home.indexOf("<DailySignal"),
    "recent writing should appear before the optional daily interaction",
  );
  assert.doesNotMatch(home, /SELECTED WRITING|精选文章/);
});

test("the archive supports judgment and associative browsing, not title-only scanning", async () => {
  const archive = await readFile("app/writing/archive-browser.tsx", "utf8");
  assert.match(archive, /article\.summary/);
  assert.match(archive, /article\.tags\.slice\(0, 4\)/);
  assert.match(archive, /\/explore\?q=/);
  assert.match(archive, /\/writing\?category=/);
});

test("articles preserve orientation and expose stable section links", async () => {
  const [page, renderer, styles] = await Promise.all([
    readFile("app/writing/[slug]/page.tsx", "utf8"),
    readFile("app/components/article-renderer.tsx", "utf8"),
    readFile("app/globals.css", "utf8"),
  ]);
  assert.match(page, /className="article-back"/);
  assert.match(page, /article\.displayDate/);
  assert.match(renderer, /href={`#\$\{section\.id\}`}/);
  assert.match(styles, /\.article-body h2 a:focus-visible/);
});
