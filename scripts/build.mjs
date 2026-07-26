import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { spawn } from "node:child_process";

const projectRoot = resolve(import.meta.dirname, "..");
const runtimeRoot = resolve(projectRoot, ".sites-runtime");

function parseDuration(value) {
  const match = /^(\d+)(ms|s|m)?$/.exec(value);
  if (!match) throw new Error(`Invalid duration: ${value}`);
  const multipliers = { ms: 1, s: 1_000, m: 60_000 };
  return Number(match[1]) * multipliers[match[2] ?? "ms"];
}

function executable(name) {
  return resolve(
    projectRoot,
    "node_modules",
    ".bin",
    process.platform === "win32" ? `${name}.cmd` : name,
  );
}

async function run(command, args, { timeout, killAfter, env }) {
  await new Promise((resolveRun, reject) => {
    const child = spawn(command, args, {
      cwd: projectRoot,
      env,
      stdio: "inherit",
      shell: process.platform === "win32",
    });
    let timedOut = false;
    let forceTimer;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
      forceTimer = setTimeout(() => child.kill("SIGKILL"), killAfter);
    }, timeout);
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      clearTimeout(timer);
      clearTimeout(forceTimer);
      if (!timedOut && code === 0) {
        resolveRun();
        return;
      }
      reject(
        new Error(
          timedOut
            ? `Build exceeded ${timeout}ms and was stopped.`
            : signal
              ? `Build stopped with signal ${signal}.`
              : `Build exited with code ${code}.`,
        ),
      );
    });
  });
}

await Promise.all([
  mkdir(resolve(runtimeRoot, "home"), { recursive: true }),
  mkdir(resolve(runtimeRoot, "tmp"), { recursive: true }),
  mkdir(resolve(runtimeRoot, "wrangler"), { recursive: true }),
]);

const env = {
  ...process.env,
  HOME: resolve(runtimeRoot, "home"),
  TMPDIR: resolve(runtimeRoot, "tmp"),
  WRANGLER_WRITE_LOGS: "false",
  WRANGLER_LOG_PATH: resolve(runtimeRoot, "wrangler"),
  MINIFLARE_REGISTRY_PATH: resolve(runtimeRoot, "wrangler", "registry"),
};

console.log("Running bounded vinext build...");
await run(executable("vinext"), ["build"], {
  timeout: parseDuration(process.env.SITES_BUILD_TIMEOUT ?? "3m"),
  killAfter: parseDuration(process.env.SITES_BUILD_KILL_AFTER ?? "10s"),
  env,
});

await run(
  process.execPath,
  [
    "--experimental-loader",
    resolve(projectRoot, "scripts", "cloudflare-workers-loader.mjs"),
    resolve(projectRoot, "scripts", "validate-artifact.mjs"),
  ],
  {
    timeout: 30_000,
    killAfter: 5_000,
    env,
  },
);
