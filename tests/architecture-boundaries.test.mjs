import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { glob } from "node:fs/promises";
import test from "node:test";

test("presentation does not import infrastructure or the raw catalog", async () => {
  const files = [];
  for await (const file of glob("app/**/*.{ts,tsx}")) {
    if (file.includes("/application/") || file.includes("/composition/") || file.includes("/infrastructure/") || file.includes("/content/")) continue;
    files.push(file);
  }

  for (const file of files) {
    const source = await readFile(file, "utf8");
    assert.doesNotMatch(source, /from ["'][^"']*infrastructure\//, `${file} bypasses the application boundary`);
    assert.doesNotMatch(source, /from ["'][^"']*content\/catalog/, `${file} imports the raw catalog`);
  }
});

test("application layer has no React or Next.js dependency", async () => {
  for await (const file of glob("app/application/*.{ts,tsx}")) {
    const source = await readFile(file, "utf8");
    assert.doesNotMatch(source, /from ["'](?:react|next)/, `${file} depends on a presentation framework`);
  }
});

test("application layer depends on domain ports, not infrastructure adapters", async () => {
  for await (const file of glob("app/application/*.{ts,tsx}")) {
    const source = await readFile(file, "utf8");
    assert.doesNotMatch(source, /infrastructure\//, `${file} imports an infrastructure adapter`);
    assert.doesNotMatch(source, /content\/catalog/, `${file} imports authored storage directly`);
  }
});

test("composition root is the only layer wiring concrete infrastructure", async () => {
  for await (const file of glob("app/**/*.{ts,tsx}")) {
    if (file.startsWith("app/composition/") || file.startsWith("app/infrastructure/")) continue;
    const source = await readFile(file, "utf8");
    assert.doesNotMatch(source, /infrastructure\//, `${file} bypasses the composition root`);
  }
});

test("database access stays inside infrastructure and health diagnostics", async () => {
  for await (const file of glob("app/**/*.{ts,tsx}")) {
    if (file.startsWith("app/infrastructure/") || file === "app/api/health/route.ts") continue;
    const source = await readFile(file, "utf8");
    assert.doesNotMatch(source, /env\.DB|cloudflare:workers/, `${file} reaches through the persistence boundary`);
  }
});
