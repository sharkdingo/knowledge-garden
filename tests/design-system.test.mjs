import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("theme values come from the persistent profile, not the stylesheet", async () => {
  const [css, layout, migration] = await Promise.all([
    readFile("app/globals.css", "utf8"),
    readFile("app/layout.tsx", "utf8"),
    readFile("drizzle/0001_thin_argent.sql", "utf8"),
  ]);
  assert.doesNotMatch(css, /--bg:\s*#[0-9a-f]{6}/i);
  assert.match(layout, /themeCss\(profile\.theme\)/);
  assert.match(migration, /"accent":"#43b58f"/);
  assert.match(migration, /"bg":"#181a1b"/);
});

test("reading views retain constrained measures", async () => {
  const css = await readFile("app/globals.css", "utf8");
  assert.match(css, /\.archive-page\s*\{[^}]*820px/s);
  assert.match(css, /\.article-page\s*\{[^}]*760px/s);
});

test("immersive effects respect reduced motion", async () => {
  const css = await readFile("app/globals.css", "utf8");
  assert.match(css, /\.intro-stage/);
  assert.match(css, /@keyframes intro-breathe/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /animation-duration:\s*0\.01ms !important/);
});

test("the interface exposes stronger controls and readable microcopy", async () => {
  const [css, migration] = await Promise.all([
    readFile("app/globals.css", "utf8"),
    readFile("drizzle/0004_ui-ux-audit.sql", "utf8"),
  ]);
  assert.match(css, /Readability, control clarity/);
  assert.match(css, /font-size:\s*0\.75rem/);
  assert.match(css, /prefers-contrast:\s*more/);
  assert.match(css, /prefers-reduced-transparency:\s*reduce/);
  assert.match(migration, /#8b9195/);
  assert.match(migration, /#6d7276/);
});
