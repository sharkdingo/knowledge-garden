import { mkdir, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { spawn } from "node:child_process";

const projectRoot = resolve(import.meta.dirname, "..");
const wrangler = resolve(
  projectRoot,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "wrangler.cmd" : "wrangler",
);
const config = resolve(projectRoot, "wrangler.local.jsonc");
const persistence = resolve(projectRoot, ".wrangler", "state");
const databaseState = resolve(persistence, "v3", "d1");
const binding = "DB";
const action = process.argv[2] ?? "migrate";
const argumentsAfterAction = process.argv.slice(3);

function runWrangler(args) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(wrangler, args, {
      cwd: projectRoot,
      env: {
        ...process.env,
        CI: "true",
        WRANGLER_SEND_METRICS: "false",
        WRANGLER_WRITE_LOGS: "false",
        WRANGLER_LOG_PATH: resolve(projectRoot, ".wrangler", "logs"),
      },
      stdio: "inherit",
      shell: process.platform === "win32",
    });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) {
        resolveRun();
        return;
      }
      reject(
        new Error(
          signal
            ? `Wrangler stopped with signal ${signal}.`
            : `Wrangler exited with code ${code}.`,
        ),
      );
    });
  });
}

const localArguments = [
  binding,
  "--local",
  "--config",
  config,
  "--persist-to",
  persistence,
];

async function migrate() {
  await mkdir(persistence, { recursive: true });
  await runWrangler(["d1", "migrations", "apply", ...localArguments]);
}

async function status() {
  await mkdir(persistence, { recursive: true });
  await runWrangler(["d1", "migrations", "list", ...localArguments]);
}

async function backup() {
  const requested = argumentsAfterAction.find((argument) => !argument.startsWith("--"));
  const timestamp = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
  const output = resolve(
    projectRoot,
    requested ?? `.local-backups/knowledge-garden-${timestamp}.sql`,
  );
  await mkdir(dirname(output), { recursive: true });
  await runWrangler([
    "d1",
    "export",
    binding,
    "--local",
    "--config",
    config,
    "--output",
    output,
    "--skip-confirmation",
  ]);
  console.log(`Local D1 backup written to ${output}`);
}

async function reset() {
  if (!argumentsAfterAction.includes("--yes")) {
    throw new Error(
      "Reset deletes only the local D1 database. Re-run with `npm run db:reset -- --yes` to confirm.",
    );
  }
  await rm(databaseState, { recursive: true, force: true });
  await migrate();
  console.log("Local D1 was reset and all migrations were reapplied.");
}

const actions = { migrate, status, backup, reset };
const selected = actions[action];
if (!selected) {
  throw new Error(`Unknown local database action: ${action}`);
}

await selected();
