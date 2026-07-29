import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("local startup migrates the same persistent D1 opened by Vite", async () => {
  const [packageSource, localDatabase, localRuntime, localConfig, viteConfig] = await Promise.all([
    readFile("package.json", "utf8"),
    readFile("scripts/local-db.mjs", "utf8"),
    readFile("scripts/local-runtime.mjs", "utf8"),
    readFile("wrangler.local.jsonc", "utf8"),
    readFile("vite.config.ts", "utf8"),
  ]);
  const packageJson = JSON.parse(packageSource);
  const config = JSON.parse(localConfig);

  assert.match(packageJson.scripts.dev, /local-runtime\.mjs dev/);
  assert.match(packageJson.scripts.start, /local-runtime\.mjs start/);
  assert.match(packageJson.scripts["db:migrate"], /local-db\.mjs migrate/);
  assert.equal(
    packageJson.scripts["validate:artifact"],
    "node --experimental-loader ./scripts/cloudflare-workers-loader.mjs ./scripts/validate-artifact.mjs",
  );
  assert.match(localRuntime, /"preview"/);
  assert.doesNotMatch(localRuntime, /vinext/);
  assert.equal(config.d1_databases[0].binding, "DB");
  assert.equal(config.d1_databases[0].database_name, "site-creator-d1");
  assert.equal(config.d1_databases[0].migrations_dir, "./drizzle");
  assert.match(localDatabase, /\.wrangler", "state"/);
  assert.match(localDatabase, /persistence, "v3", "d1"/);
  assert.match(localDatabase, /"d1", "migrations", "apply"/);
  assert.doesNotMatch(localDatabase, /--remote/);
  assert.match(localDatabase, /WRANGLER_SEND_METRICS/);
  assert.match(viteConfig, /database_name: "site-creator-d1"/);
});

test("local Studio identity is opt-in, allowlisted, and loopback-only", async () => {
  const [identityService, identityAdapter, access, viteConfig, example, ignore] = await Promise.all([
    readFile("app/application/local-identity-service.ts", "utf8"),
    readFile("app/infrastructure/environment-local-identity-repository.ts", "utf8"),
    readFile("app/infrastructure/environment-studio-access-repository.ts", "utf8"),
    readFile("vite.config.ts", "utf8"),
    readFile(".dev.vars.example", "utf8"),
    readFile(".gitignore", "utf8"),
  ]);

  assert.match(identityService, /localhost/);
  assert.match(identityService, /127\.0\.0\.1/);
  assert.match(identityService, /\[::1\]/);
  assert.doesNotMatch(identityService, /cloudflare:workers/);
  assert.match(identityAdapter, /LOCAL_STUDIO_AUTH/);
  assert.match(access, /STUDIO_EDITOR_EMAILS/);
  assert.match(viteConfig, /isLocalDevelopment/);
  assert.match(viteConfig, /process\.loadEnvFile/);
  assert.match(example, /LOCAL_STUDIO_USER_EMAIL/);
  assert.match(ignore, /\.dev\.vars\*/);
  assert.match(ignore, /!\.dev\.vars\.example/);
});

test("readiness detects an uninitialized database instead of accepting SELECT 1", async () => {
  const [health, schema] = await Promise.all([
    readFile("app/api/health/route.ts", "utf8"),
    readFile("db/schema.ts", "utf8"),
  ]);
  const applicationTables = [...schema.matchAll(/sqliteTable\("([^"]+)"/g)]
    .map((match) => match[1]);
  assert.match(health, /sqlite_master/);
  for (const requiredCapabilityTable of applicationTables) {
    assert.match(health, new RegExp(`"${requiredCapabilityTable}"`));
  }
  assert.match(health, /"d1_migrations"/);
  assert.match(health, /uninitialized/);
  assert.match(health, /WHERE key = 'profile'/);
  assert.doesNotMatch(health, /SELECT 1 AS ready/);
});

test("local operations document persistence, backup, reset, and Windows startup", async () => {
  const documentation = await readFile("docs/local-development.md", "utf8");
  assert.match(documentation, /\.wrangler\/state\/v3/);
  assert.match(documentation, /npm run db:backup/);
  assert.match(documentation, /npm run db:reset -- --yes/);
  assert.match(documentation, /PowerShell/);
  assert.match(documentation, /production database/i);
});
