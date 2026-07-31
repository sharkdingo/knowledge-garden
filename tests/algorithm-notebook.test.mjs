import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("algorithm notes use a dedicated domain aggregate and D1 adapter", async () => {
  const [domain, studioDomain, service, studioService, repository, composition] = await Promise.all([
    readFile("app/domain/content.ts", "utf8"),
    readFile("app/domain/studio.ts", "utf8"),
    readFile("app/application/algorithm-problem-service.ts", "utf8"),
    readFile("app/application/studio-algorithm-service.ts", "utf8"),
    readFile("app/infrastructure/d1-algorithm-repository.ts", "utf8"),
    readFile("app/composition/content.ts", "utf8"),
  ]);
  assert.match(domain, /interface AlgorithmProblemRepository/);
  assert.match(studioDomain, /interface StudioAlgorithmProblemRepository/);
  assert.doesNotMatch(service, /cloudflare:workers|env\.DB|infrastructure\//);
  assert.doesNotMatch(studioService, /cloudflare:workers|env\.DB|infrastructure\//);
  assert.match(repository, /implements AlgorithmProblemRepository, StudioAlgorithmProblemRepository/);
  assert.match(repository, /WHERE p\.status = 'published'/);
  assert.match(repository, /d1\.batch/);
  assert.match(repository, /storageId\(input\.slug/);
  assert.match(repository, /INSERT INTO tags/);
  assert.match(repository, /INSERT INTO algorithm_problem_tags[\s\S]*SELECT \?, id/);
  assert.match(repository, /DELETE FROM algorithm_references[\s\S]*DELETE FROM algorithm_solutions/);
  assert.match(repository, /INSERT INTO algorithm_references/);
  assert.doesNotMatch(repository, /await d1\.batch\(input\.tags/);
  assert.match(composition, /D1AlgorithmRepository/);
  assert.match(composition, /StudioAlgorithmProblemService/);
});

test("the public notebook is persistent, searchable, and deeply readable", async () => {
  const [schemaMigration, contentMigration, enhancementMigration, archive, page, detail, codeDeck, searchRepository, sitemap, feed] = await Promise.all([
    readFile("drizzle/0012_clever_luckman.sql", "utf8"),
    readFile("drizzle/0013_first_algorithm_note.sql", "utf8"),
    readFile("drizzle/0014_peaceful_purple_man.sql", "utf8"),
    readFile("app/problems/problem-archive.tsx", "utf8"),
    readFile("app/problems/page.tsx", "utf8"),
    readFile("app/problems/[slug]/page.tsx", "utf8"),
    readFile("app/problems/[slug]/algorithm-code-deck.tsx", "utf8"),
    readFile("app/infrastructure/d1-search-repository.ts", "utf8"),
    readFile("app/sitemap.ts", "utf8"),
    readFile("app/feed.xml/route.ts", "utf8"),
  ]);
  assert.doesNotMatch(schemaMigration, /INSERT INTO `algorithm_problems`/);
  assert.match(schemaMigration, /题库正在等待第一条真实记录/);
  assert.doesNotMatch(contentMigration, /INSERT INTO `algorithm_problems`/);
  assert.match(enhancementMigration, /algorithm_references/);
  assert.doesNotMatch(enhancementMigration, /INSERT INTO `algorithm_references`/);
  assert.match(enhancementMigration, /algorithmAuthoring/);
  assert.doesNotMatch(contentMigration, /mock|placeholder|lorem/i);
  assert.match(archive, /config\.searchPlaceholder/);
  assert.match(archive, /config\.difficultyLabels/);
  assert.match(page, /profile\.pages\.algorithms/);
  assert.match(detail, /copy\.proofTitle/);
  assert.match(detail, /copy\.complexityTitle/);
  assert.match(detail, /copy\.pitfallsTitle/);
  assert.match(detail, /algorithm-approach-overview/);
  assert.match(detail, /copy\.implementationsLabel/);
  assert.match(detail, /algorithm-language-badges/);
  assert.match(detail, /problem\.references/);
  assert.match(detail, /copy\.referencesTitle/);
  assert.match(detail, /<MathText/);
  assert.match(codeDeck, /navigator\.clipboard/);
  assert.match(codeDeck, /role="tablist"/);
  assert.match(codeDeck, /role="tabpanel"/);
  assert.match(codeDeck, /ArrowRight/);
  assert.match(codeDeck, /copyErrorLabel/);
  assert.match(searchRepository, /'题解'/);
  assert.match(searchRepository, /algorithm_problems/);
  assert.match(sitemap, /\/problems/);
  assert.match(feed, /算法题解/);
});

test("Studio provides an authorized and recoverable algorithm publishing loop", async () => {
  const [collectionRoute, itemRoute, editor, service, shell, siteEditor, unsavedChanges] = await Promise.all([
    readFile("app/api/studio/problems/route.ts", "utf8"),
    readFile("app/api/studio/problems/[slug]/route.ts", "utf8"),
    readFile("app/studio/problems/problem-editor.tsx", "utf8"),
    readFile("app/application/studio-algorithm-service.ts", "utf8"),
    readFile("app/studio/studio-shell.tsx", "utf8"),
    readFile("app/studio/site/site-editor.tsx", "utf8"),
    readFile("app/studio/components/unsaved-changes.tsx", "utf8"),
  ]);
  assert.match(collectionRoute, /authorizeStudioApi/);
  assert.match(itemRoute, /authorizeStudioApi/);
  assert.match(editor, /useStudioUnsavedChanges/);
  assert.match(unsavedChanges, /beforeunload/);
  assert.match(editor, /crypto\.randomUUID/);
  assert.match(editor, /noValidate/);
  assert.match(editor, /data-draft-required/);
  assert.doesNotMatch(editor, />稳定 ID</);
  assert.match(editor, /添加解法/);
  assert.match(editor, /添加语言实现/);
  assert.match(editor, /authoring\.languagePresets/);
  assert.match(editor, /添加引用/);
  assert.match(editor, /authoring\.referenceHelp/);
  assert.match(editor, /ConfirmationDialog/);
  assert.match(service, /发布前至少需要写出一个完整解法/);
  assert.match(service, /正确性说明/);
  assert.match(shell, /\/studio\/problems/);
  assert.match(siteEditor, /题库界面文案/);
  assert.match(siteEditor, /algorithmHub/);
  assert.match(siteEditor, /algorithmAuthoring/);
  assert.match(siteEditor, /题解创作预设/);
});

test("algorithm layouts protect mobile reading and code overflow", async () => {
  const css = await readFile("app/globals.css", "utf8");
  assert.match(css, /\.algorithm-problem\s*\{[^}]*grid-template-columns/s);
  assert.match(css, /\.algorithm-code-scroll\s*\{[^}]*overflow/s);
  assert.match(css, /@media \(max-width: 620px\)[\s\S]*\.algorithm-intro\s*\{[^}]*flex-direction: column/s);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /\.math-display\s*\{[^}]*overflow-x: auto/s);
  assert.match(css, /\.algorithm-language-badges/);
  assert.match(css, /\.algorithm-references/);
});

test("algorithm math is server-rendered accessibly with restricted KaTeX options", async () => {
  const [math, layout, manifest] = await Promise.all([
    readFile("app/components/math-text.tsx", "utf8"),
    readFile("app/layout.tsx", "utf8"),
    readFile("package.json", "utf8"),
  ]);
  assert.match(manifest, /"katex"/);
  assert.match(layout, /katex\/dist\/katex\.min\.css/);
  assert.match(math, /renderToString/);
  assert.match(math, /output: "htmlAndMathml"/);
  assert.match(math, /trust: false/);
  assert.match(math, /throwOnError: false/);
  assert.match(math, /\\\[\.\.\.\\\]|parseMathText/);
});
