import assert from "node:assert/strict";
import test from "node:test";
import { rankSearchEntries, searchTokens } from "../app/domain/search.ts";

const entries = [
  {
    title: "Server-first 架构实践",
    detail: "工程 · 8 分钟",
    excerpt: "从依赖方向开始设计稳定边界。",
    href: "/writing/server-first",
    type: "文章",
    tags: ["架构", "Cloudflare"],
    keywords: "repository 依赖倒置 worker",
  },
  {
    title: "边缘知识花园",
    detail: "个人项目",
    excerpt: "一个采用 Server-first 架构的内容系统。",
    href: "/projects#project-garden",
    type: "项目",
    tags: ["架构", "React"],
    keywords: "cloudflare worker",
  },
  {
    title: "阅读体验设计",
    detail: "设计 · 5 分钟",
    excerpt: "排版、节奏与专注模式。",
    href: "/writing/reading",
    type: "文章",
    tags: ["UX"],
    keywords: "阅读 人机交互",
  },
];

test("search ranking favors exact fields while requiring every query token", () => {
  const ranked = rankSearchEntries(entries, "Server-first 架构");
  assert.equal(ranked.length, 2);
  assert.equal(ranked[0].href, "/writing/server-first");
  assert.ok(ranked[0].score > ranked[1].score);
  assert.deepEqual(searchTokens("  架构   架构 Cloudflare "), ["架构", "cloudflare"]);
  assert.deepEqual(rankSearchEntries(entries, "架构 阅读"), []);
});
