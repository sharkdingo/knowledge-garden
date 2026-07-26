import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const projectRoot = resolve(import.meta.dirname, "..");
const workerPath = resolve(projectRoot, "dist", "server", "index.js");
const hostingPath = resolve(projectRoot, "dist", ".openai", "hosting.json");
const migrationsPath = resolve(projectRoot, "dist", ".openai", "drizzle");

await Promise.all([
  access(workerPath),
  access(hostingPath),
  access(migrationsPath),
]);

JSON.parse(await readFile(hostingPath, "utf8"));
const workerUrl = pathToFileURL(workerPath);
workerUrl.searchParams.set("sites-validation", `${process.pid}-${Date.now()}`);
const worker = await import(workerUrl.href);
if (!worker.default || typeof worker.default.fetch !== "function") {
  throw new Error(
    "dist/server/index.js must have an ESM default export with fetch(request, env, ctx)",
  );
}

console.log(
  "Validated Sites artifact: Worker entry, hosting manifest, and migrations are present.",
);
