import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { cp, mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const temporaryRoot = resolve(projectRoot, "..", ".tmp-simple-site-http");
await mkdir(temporaryRoot, { recursive: true });
const runtimeRoot = await mkdtemp(resolve(temporaryRoot, "run-"));
await cp(projectRoot, runtimeRoot, {
  recursive: true,
  filter(source) {
    const excluded = [
      resolve(projectRoot, ".git"),
      resolve(projectRoot, ".next"),
      resolve(projectRoot, ".wrangler"),
      resolve(projectRoot, "dist"),
      resolve(projectRoot, "node_modules"),
    ];
    return !excluded.some((path) => source === path || source.startsWith(`${path}/`));
  },
});
await symlink(resolve(projectRoot, "node_modules"), resolve(runtimeRoot, "node_modules"), "dir");
const port = 4191;
const baseUrl = `http://127.0.0.1:${port}`;
const devVarsPath = resolve(runtimeRoot, ".dev.vars");
await writeFile(devVarsPath, [
  "STUDIO_EDITOR_EMAILS=e2e@example.test",
  "LOCAL_STUDIO_AUTH=true",
  "LOCAL_STUDIO_USER_EMAIL=e2e@example.test",
  "LOCAL_STUDIO_USER_NAME=E2E editor",
  "",
].join("\n"));

const output = [];
const server = spawn(
  process.execPath,
  [
    resolve(runtimeRoot, "scripts/local-runtime.mjs"),
    "dev",
    "--host", "127.0.0.1",
    "--port", String(port),
    "--strictPort",
  ],
  {
    cwd: runtimeRoot,
    env: {
      ...process.env,
      CI: "true",
      WRANGLER_SEND_METRICS: "false",
    },
    stdio: ["ignore", "pipe", "pipe"],
    detached: process.platform !== "win32",
  },
);
for (const stream of [server.stdout, server.stderr]) {
  stream.setEncoding("utf8");
  stream.on("data", (chunk) => {
    output.push(chunk);
    if (output.length > 80) output.shift();
  });
}

async function waitForServer() {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`Local server exited early.\n${output.join("")}`);
    }
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.status > 0) return;
    } catch {
      // Startup is still in progress.
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 250));
  }
  throw new Error(`Local server did not become ready.\n${output.join("")}`);
}

async function request(path, options = {}, expected = 200) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const body = await response.text();
  assert.equal(
    response.status,
    expected,
    `${options.method ?? "GET"} ${path}: ${body}`,
  );
  const type = response.headers.get("content-type") ?? "";
  return type.includes("application/json") ? JSON.parse(body) : body;
}

const article = {
  slug: "http-journey",
  title: "真实 HTTP 旅程",
  summary: "用于验证主人发布与访客阅读的完整调用链。",
  publishedAt: "2026-07-28T00:00:00Z",
  displayDate: "2026.07.28",
  categoryId: "http-engineering",
  minutes: 4,
  featured: false,
  lead: "这不是预制内容，只存在于隔离的端到端测试数据库。",
  quote: "",
  calloutLabel: "",
  calloutLines: [],
  status: "published",
  tags: ["E2E"],
  sections: [{
    id: "verified",
    title: "被真实请求验证",
    paragraphs: ["分类、发布、搜索、回应、冲突与归档经过同一套生产路由。"],
  }],
};
const project = {
  id: "http-project",
  name: "HTTP 验证项目",
  subtitle: "真实路由上的并发项目",
  description: "验证项目创建、更新、冲突、归档与恢复。",
  status: "active",
  statusLabel: "持续演进",
  category: "工程实践",
  stack: ["TypeScript", "D1"],
  updated: "2026.07.28",
  visual: "agent",
  relatedArticleSlug: "http-journey",
  repositoryUrl: "",
  demoUrl: "",
  sortOrder: 10,
};
const problem = {
  slug: "http-two-sum",
  platform: "LeetCode",
  problemId: "1",
  title: "两数之和",
  difficulty: "easy",
  sourceUrl: "",
  summary: "",
  statement: "",
  constraints: [],
  status: "draft",
  solvedAt: "2026-07-28",
  featured: false,
  tags: ["哈希表"],
  solutions: [],
  references: [],
};

try {
  await waitForServer();
  const health = await request("/api/health");
  assert.equal(health.status, "ok");

  const home = await request("/");
  assert.match(home, /sharkdingo/);

  await request("/api/studio/categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: "http-engineering",
      name: "HTTP 工程验证",
      description: "真实系统的设计与验证。",
      sortOrder: 10,
    }),
  }, 201);

  await request("/api/studio/articles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(article),
  }, 201);

  const published = await request("/writing/http-journey");
  assert.match(published, /真实 HTTP 旅程/);
  assert.match(published, /href="#verified"/);
  assert.match(published, /2026\.07\.28/);
  const populatedHome = await request("/");
  assert.ok(
    populatedHome.indexOf("home-latest") < populatedHome.indexOf("daily-signal"),
    "latest writing must precede optional daily interaction",
  );
  const archive = await request("/writing");
  assert.match(archive, /用于验证主人发布与访客阅读的完整调用链/);
  assert.match(archive, /E2E<\/a>/);
  const search = await request("/api/search");
  assert.ok(search.entries.some((entry) => entry.href === "/writing/http-journey"));

  const reaction = await request(
    "/api/articles/http-journey/reaction?visitorKey=123e4567-e89b-42d3-a456-426614174000",
  );
  assert.ok(reaction.counts.length > 0);
  const reacted = await request("/api/articles/http-journey/reaction", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      visitorKey: "123e4567-e89b-42d3-a456-426614174000",
      reactionId: reaction.counts[0].id,
    }),
  });
  assert.equal(reacted.total, 1);

  const updated = await request("/api/studio/articles/http-journey", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "If-Match": "1",
    },
    body: JSON.stringify({ ...article, summary: "已经通过第一次并发安全更新。" }),
  });
  assert.equal(updated.version, 2);

  await request("/api/studio/articles/http-journey", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "If-Match": "1",
    },
    body: JSON.stringify({ ...article, summary: "这次陈旧更新必须被拒绝。" }),
  }, 409);

  await request("/api/studio/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(project),
  }, 201);
  const updatedProject = await request("/api/studio/projects/http-project", {
    method: "PUT",
    headers: { "Content-Type": "application/json", "If-Match": "1" },
    body: JSON.stringify({ ...project, description: "已通过并发安全更新。" }),
  });
  assert.equal(updatedProject.version, 2);
  await request("/api/studio/projects/http-project", {
    method: "PUT",
    headers: { "Content-Type": "application/json", "If-Match": "1" },
    body: JSON.stringify(project),
  }, 409);

  await request("/api/studio/problems", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(problem),
  }, 201);
  const updatedProblem = await request("/api/studio/problems/http-two-sum", {
    method: "PUT",
    headers: { "Content-Type": "application/json", "If-Match": "1" },
    body: JSON.stringify({ ...problem, summary: "草稿也受版本保护。" }),
  });
  assert.equal(updatedProblem.version, 2);
  await request("/api/studio/problems/http-two-sum", {
    method: "PUT",
    headers: { "Content-Type": "application/json", "If-Match": "1" },
    body: JSON.stringify(problem),
  }, 409);

  const backup = await request("/api/studio/export");
  assert.equal(backup.schemaVersion, 1);
  assert.equal(backup.tables.articles.length, 1);
  assert.equal(backup.tables.projects.length, 1);
  assert.equal(backup.tables.algorithm_problems.length, 1);
  const preview = await request("/api/studio/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode: "preview", snapshot: backup }),
  });
  assert.match(preview.confirmationCode, /^RESTORE-[A-F0-9]{8}$/);

  await request("/api/studio/articles/http-journey", {
    method: "DELETE",
    headers: { "If-Match": "2" },
  });
  await request("/api/studio/projects/http-project", {
    method: "DELETE",
    headers: { "If-Match": "2" },
  });
  await request("/api/studio/problems/http-two-sum", {
    method: "DELETE",
    headers: { "If-Match": "2" },
  });
  await request("/writing/http-journey", {}, 404);

  await request("/api/studio/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mode: "apply",
      snapshot: backup,
      confirmationCode: preview.confirmationCode,
    }),
  });
  const restoredArticle = await request("/writing/http-journey");
  assert.match(restoredArticle, /真实 HTTP 旅程/);
  const restoredBackup = await request("/api/studio/export");
  assert.equal(restoredBackup.tables.projects[0].row_version, 2);
  assert.equal(restoredBackup.tables.algorithm_problems[0].row_version, 2);
  const savedPoints = await request("/api/studio/restore-points");
  assert.equal(savedPoints.restorePoints.length, 1);
  const archivedPointId = savedPoints.restorePoints[0].id;
  await request("/api/studio/restore-points", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: archivedPointId }),
  });
  await request("/writing/http-journey", {}, 404);
  const pointsAfterRollback = await request("/api/studio/restore-points");
  const restoredPoint = pointsAfterRollback.restorePoints.find(
    (point) => point.id !== archivedPointId,
  );
  assert.ok(restoredPoint);
  await request("/api/studio/restore-points", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: restoredPoint.id }),
  });
  await request("/writing/http-journey");

  console.log(
    "HTTP journey passed: authoring, discovery, engagement, conflicts, archive and safe restore.",
  );
} finally {
  const stopServer = (signal) => {
    if (process.platform !== "win32" && server.pid) {
      try {
        process.kill(-server.pid, signal);
      } catch {
        // The process group has already stopped.
      }
    } else {
      server.kill(signal);
    }
  };
  stopServer("SIGTERM");
  await new Promise((resolveExit) => {
    if (server.exitCode !== null) return resolveExit();
    server.once("exit", resolveExit);
    setTimeout(() => {
      stopServer("SIGKILL");
      resolveExit();
    }, 5_000);
  });
  await rm(runtimeRoot, { recursive: true, force: true });
}
