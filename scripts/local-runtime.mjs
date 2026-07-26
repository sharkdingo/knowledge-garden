import { spawn } from "node:child_process";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const mode = process.argv[2];
const forwardedArguments = process.argv.slice(3);

if (mode !== "dev" && mode !== "start") {
  throw new Error("Usage: node scripts/local-runtime.mjs <dev|start> [arguments]");
}

function executable(name) {
  return resolve(
    projectRoot,
    "node_modules",
    ".bin",
    process.platform === "win32" ? `${name}.cmd` : name,
  );
}

function run(command, args, env = process.env) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, args, {
      cwd: projectRoot,
      env,
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
            ? `${command} stopped with signal ${signal}.`
            : `${command} exited with code ${code}.`,
        ),
      );
    });
  });
}

await run(process.execPath, [resolve(projectRoot, "scripts", "local-db.mjs"), "migrate"]);

const env = {
  ...process.env,
  WRANGLER_LOG_PATH: resolve(projectRoot, ".wrangler", "wrangler.log"),
};
const command = executable("vite");
const args =
  mode === "dev" ? forwardedArguments : ["preview", ...forwardedArguments];
await run(command, args, env);
