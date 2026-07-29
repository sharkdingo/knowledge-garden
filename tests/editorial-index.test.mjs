import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("the public visual identity is content-led and profile-configured", async () => {
  const [home, css, migration, profileSchema] = await Promise.all([
    readFile("app/page.tsx", "utf8"),
    readFile("app/globals.css", "utf8"),
    readFile("drizzle/0020_editorial_index.sql", "utf8"),
    readFile("app/domain/site-profile-schema.ts", "utf8"),
  ]);

  assert.match(home, /hero\.titleLines \?\? \[hero\.title\]/);
  assert.match(home, /hero\.primaryAction/);
  assert.match(home, /profile\.about\.location/);
  assert.match(home, /daily\?\.dayOfYear/);
  assert.doesNotMatch(home, /<Image|intro-media|button-glass/);

  assert.match(css, /\.editorial-hero\s*\{[^}]*grid-template-columns/s);
  assert.match(css, /\.editorial-hero-copy h1\s*\{[^}]*var\(--font-editorial\)/s);
  assert.match(css, /\.daily-signal\s*\{[^}]*background:\s*transparent/s);
  assert.doesNotMatch(css, /--bg:\s*#[0-9a-f]{6}/i);

  assert.match(migration, /'\$\.theme\.light\.accent', '#9b3a2e'/);
  assert.match(migration, /'\$\.theme\.dark\.accent', '#d56b5a'/);
  assert.match(
    profileSchema,
    /LATEST_DATABASE_MIGRATION = "0021_article_draft_integrity\.sql"/,
  );
});

test("the public header does not attach a scroll listener for cosmetic state", async () => {
  const header = await readFile("app/components/site-header.tsx", "utf8");
  assert.doesNotMatch(header, /window\.scrollY|addEventListener\("scroll"/);
  assert.match(header, /className="site-header"/);
});
