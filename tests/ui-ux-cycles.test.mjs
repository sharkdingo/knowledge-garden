import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("round one preserves authored CJK hero lines and uses the header's true responsive threshold", async () => {
  const [styles, header] = await Promise.all([
    readFile("app/globals.css", "utf8"),
    readFile("app/components/site-header.tsx", "utf8"),
  ]);

  assert.match(styles, /\.editorial-hero-copy h1\s*\{[^}]*max-width: none/s);
  assert.match(styles, /\.editorial-hero-copy h1 span\s*\{[^}]*white-space: nowrap/s);
  assert.match(
    styles,
    /@media \(max-width: 760px\)[\s\S]*?\.editorial-hero-copy h1 span\s*\{[^}]*white-space: normal/s,
  );
  assert.match(styles, /@media \(min-width: 761px\) and \(max-width: 1080px\)/);
  assert.match(header, /matchMedia\("\(min-width: 1081px\)"\)/);
});

test("round one keeps the opening editorial but reveals onward content sooner", async () => {
  const styles = await readFile("app/globals.css", "utf8");

  assert.match(
    styles,
    /\.editorial-hero\s*\{[^}]*min-height: min\(548px, calc\(100svh - 84px\)\)/s,
  );
  assert.match(styles, /\.editorial-hero\s*\{[^}]*grid-template-columns: 172px minmax\(0, 1fr\) 112px/s);
  assert.match(styles, /\.editorial-issue\s*\{[^}]*font-size: clamp\(4rem, 7vw, 6\.4rem\)/s);
});

test("round two keeps search feedback truthful and ranking work singular", async () => {
  const search = await readFile("app/components/search-palette.tsx", "utf8");

  assert.match(search, /const rankedResults = useMemo\(\(\) => rankSearchEntries\(index, query\)/);
  assert.match(search, /indexState === "error"\s*\?\s*"搜索服务暂时不可用"/);
  assert.equal((search.match(/rankSearchEntries\(index, query\)/g) ?? []).length, 1);
});

test("round two restores reading-control focus and keeps the active Studio route visible", async () => {
  const [reading, studioNavigation, styles] = await Promise.all([
    readFile("app/components/reading-focus.tsx", "utf8"),
    readFile("app/studio/studio-navigation.tsx", "utf8"),
    readFile("app/globals.css", "utf8"),
  ]);

  assert.match(reading, /settingsButtonRef\.current\?\.focus\(\)/);
  assert.match(reading, /aria-labelledby="reading-preferences-title"/);
  assert.match(studioNavigation, /querySelector<HTMLElement>\('\[aria-current="page"\]'\)/);
  assert.match(studioNavigation, /scrollIntoView\(\{ block: "nearest", inline: "center" \}\)/);
  assert.match(styles, /\.studio-header nav\s*\{[^}]*scroll-snap-type: x proximity/s);
});

test("round two navigation motion signals progress without making reading content disappear", async () => {
  const styles = await readFile("app/globals.css", "utf8");

  assert.match(styles, /html\.route-pending \.site-root > main\s*\{[^}]*opacity: 0\.96/s);
  assert.match(styles, /html\.route-arrived \.site-root > main\s*\{[^}]*280ms/s);
  assert.doesNotMatch(
    styles.match(/html\.route-pending \.site-root > main\s*\{[^}]*\}/s)?.[0] ?? "",
    /transform:/,
  );
});
