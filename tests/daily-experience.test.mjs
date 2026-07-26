import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("daily curation is deterministic, content-backed, and configurable", async () => {
  const [service, page, migration, repository] = await Promise.all([
    readFile("app/application/daily-experience-service.ts", "utf8"),
    readFile("app/page.tsx", "utf8"),
    readFile("drizzle/0009_daily_signal.sql", "utf8"),
    readFile("app/infrastructure/d1-studio-repository.ts", "utf8"),
  ]);
  assert.match(service, /dateKey|parts\.key/);
  assert.match(service, /source\.articles/);
  assert.match(service, /source\.projects/);
  assert.doesNotMatch(service, /Math\.random/);
  assert.match(page, /contentServices\.daily\.create/);
  assert.match(migration, /\$\.daily/);
  assert.match(repository, /daily: settings\.daily/);
});

test("visitor responses remain private to the device and reset daily", async () => {
  const signal = await readFile("app/components/daily-signal.tsx", "utf8");
  assert.match(signal, /localStorage/);
  assert.match(signal, /experience\.dateKey/);
  assert.match(signal, /config\.modes/);
  assert.match(signal, /aria-live="polite"/);
});

test("navigation and reading immersion remain motion-safe", async () => {
  const [navigation, focus, css] = await Promise.all([
    readFile("app/components/navigation-experience.tsx", "utf8"),
    readFile("app/components/reading-focus.tsx", "utf8"),
    readFile("app/globals.css", "utf8"),
  ]);
  assert.match(navigation, /route-pending/);
  assert.match(navigation, /aria-live="polite"/);
  assert.match(focus, /reading-focus/);
  assert.match(focus, /Escape/);
  assert.match(css, /body\.reading-focus \.site-header/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /html\.route-arrived/);
});

test("the production shell provides its own favicon", async () => {
  const [favicon, layout] = await Promise.all([
    readFile("app/favicon.ico/route.ts", "utf8"),
    readFile("app/layout.tsx", "utf8"),
  ]);
  assert.match(favicon, /image\/svg\+xml/);
  assert.match(favicon, /profile\.theme\.dark/);
  assert.match(layout, /icons: \{ icon: "\/favicon\.ico"/);
});
