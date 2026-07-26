import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

function relativeLuminance(hex) {
  const channels = hex.match(/[0-9a-f]{2}/gi).map((value) => {
    const channel = Number.parseInt(value, 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(left, right) {
  const values = [relativeLuminance(left), relativeLuminance(right)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

async function migratedDatabase() {
  const database = new DatabaseSync(":memory:");
  database.exec("PRAGMA foreign_keys = ON");
  for (const file of [
    "drizzle/0000_equal_ricochet.sql",
    "drizzle/0001_thin_argent.sql",
    "drizzle/0002_playground.sql",
    "drizzle/0003_arcade-games.sql",
    "drizzle/0004_ui-ux-audit.sql",
    "drizzle/0005_material_zemo.sql",
    "drizzle/0006_knowledge_constellation.sql",
    "drizzle/0007_visitor_journey.sql",
    "drizzle/0008_cold_owl.sql",
    "drizzle/0009_daily_signal.sql",
    "drizzle/0010_young_magik.sql",
    "drizzle/0011_strong_toxin.sql",
    "drizzle/0012_clever_luckman.sql",
    "drizzle/0013_first_algorithm_note.sql",
    "drizzle/0014_peaceful_purple_man.sql",
    "drizzle/0015_public-source-cleanup.sql",
  ]) {
    const migration = await readFile(file, "utf8");
    for (const statement of migration.split("--> statement-breakpoint")) {
      if (statement.trim()) database.exec(statement);
    }
  }
  return database;
}

test("migrations create an empty production content graph with complete capabilities", async () => {
  const database = await migratedDatabase();
  assert.equal(database.prepare("SELECT COUNT(*) AS count FROM articles").get().count, 0);
  assert.equal(database.prepare("SELECT COUNT(*) AS count FROM categories").get().count, 0);
  assert.equal(database.prepare("SELECT COUNT(*) AS count FROM projects").get().count, 0);
  assert.equal(database.prepare("SELECT COUNT(*) AS count FROM site_settings WHERE key = 'profile'").get().count, 1);
  assert.equal(database.prepare("SELECT COUNT(*) AS count FROM navigation_items WHERE href = '/play'").get().count, 2);
  assert.equal(database.prepare("SELECT COUNT(*) AS count FROM navigation_items WHERE href = '/problems'").get().count, 2);
  assert.equal(
    database.prepare("SELECT COUNT(*) AS count FROM sqlite_master WHERE type = 'table' AND name = 'site_editors'").get().count,
    0,
  );
  assert.equal(database.prepare("SELECT COUNT(*) AS count FROM article_drafts").get().count, 0);
  assert.equal(database.prepare("SELECT COUNT(*) AS count FROM article_revisions").get().count, 0);
  assert.equal(database.prepare("SELECT COUNT(*) AS count FROM article_reactions").get().count, 0);
  assert.equal(database.prepare("SELECT COUNT(*) AS count FROM algorithm_problems").get().count, 0);
  assert.equal(database.prepare("SELECT COUNT(*) AS count FROM algorithm_solutions").get().count, 0);
  assert.equal(database.prepare("SELECT COUNT(*) AS count FROM algorithm_code_blocks").get().count, 0);
  assert.equal(database.prepare("SELECT COUNT(*) AS count FROM algorithm_references").get().count, 0);
  assert.equal(
    database.prepare("SELECT COUNT(*) AS count FROM sqlite_master WHERE type = 'index' AND name = 'article_revisions_article_created_idx'").get().count,
    1,
  );
  database.exec("BEGIN");
  database.prepare("INSERT INTO categories (id, name, description, sort_order) VALUES ('test', 'Test', 'Test', 0)").run();
  database.prepare(`
    INSERT INTO articles (
      slug, title, summary, published_at, display_date, category_id, minutes,
      featured, lead, quote, callout_label, callout_lines, status
    ) VALUES (
      'test-article', 'Test', 'Summary', '2026-07-26', '2026.07.26',
      'test', 1, 0, 'Lead', NULL, NULL, NULL, 'published'
    )
  `).run();
  const articleSlug = "test-article";
  database.prepare("INSERT INTO article_drafts (article_slug, payload, saved_at) VALUES (?, '{}', ?)").run(articleSlug, new Date().toISOString());
  database.prepare("INSERT INTO article_revisions (id, article_slug, payload, reason, created_at) VALUES ('test-revision', ?, '{}', 'saved', ?)").run(articleSlug, new Date().toISOString());
  database.prepare("INSERT INTO article_reactions (article_slug, visitor_key, reaction_id, created_at, updated_at) VALUES (?, '8afcd0bb-8108-49d4-930d-3ff971eab9b7', 'linger', ?, ?)").run(articleSlug, new Date().toISOString(), new Date().toISOString());
  database.prepare(`
    INSERT INTO article_reactions (article_slug, visitor_key, reaction_id, created_at, updated_at)
    VALUES (?, '8afcd0bb-8108-49d4-930d-3ff971eab9b7', 'clearer', ?, ?)
    ON CONFLICT(article_slug, visitor_key) DO UPDATE SET
      reaction_id = excluded.reaction_id,
      updated_at = excluded.updated_at
  `).run(articleSlug, new Date().toISOString(), new Date().toISOString());
  assert.equal(database.prepare("SELECT COUNT(*) AS count FROM article_drafts WHERE article_slug = ?").get(articleSlug).count, 1);
  assert.equal(database.prepare("SELECT COUNT(*) AS count FROM article_revisions WHERE article_slug = ?").get(articleSlug).count, 1);
  assert.equal(database.prepare("SELECT COUNT(*) AS count FROM article_reactions WHERE article_slug = ?").get(articleSlug).count, 1);
  assert.equal(database.prepare("SELECT reaction_id FROM article_reactions WHERE article_slug = ?").get(articleSlug).reaction_id, "clearer");
  database.prepare("DELETE FROM articles WHERE slug = ?").run(articleSlug);
  assert.equal(database.prepare("SELECT COUNT(*) AS count FROM article_revisions WHERE article_slug = ?").get(articleSlug).count, 0);
  assert.equal(database.prepare("SELECT COUNT(*) AS count FROM article_reactions WHERE article_slug = ?").get(articleSlug).count, 0);
  database.exec("ROLLBACK");
  database.exec("BEGIN");
  database.prepare("INSERT INTO tags (id, name) VALUES ('test-tag', 'Test Tag')").run();
  const tagId = "test-tag";
  database.prepare(`
    INSERT INTO algorithm_problems (
      slug, platform, problem_id, title, difficulty, source_url, summary,
      statement, constraints, status, solved_at, updated_at, featured
    ) VALUES (
      'two-sum', 'LeetCode', '1', 'Two Sum', 'easy',
      'https://leetcode.com/problems/two-sum/', 'summary', 'statement', '[]',
      'published', '2026-07-26', '2026-07-26T00:00:00.000Z', 1
    )
  `).run();
  database.prepare(`
    INSERT INTO algorithm_solutions (
      id, problem_slug, title, intuition, steps, proof,
      time_complexity, space_complexity, pitfalls, sort_order
    ) VALUES (
      'two-sum--hash-map', 'two-sum', 'Hash map', 'intuition', '["step"]',
      'proof', 'O(n)', 'O(n)', '[]', 0
    )
  `).run();
  database.prepare(`
    INSERT INTO algorithm_code_blocks (
      id, solution_id, language, label, code, sort_order
    ) VALUES (
      'two-sum--typescript', 'two-sum--hash-map', 'typescript',
      'TypeScript', 'return [];', 0
    )
  `).run();
  database.prepare(`
    INSERT INTO algorithm_problem_tags (problem_slug, tag_id)
    VALUES ('two-sum', ?)
  `).run(tagId);
  database.prepare(`
    INSERT INTO algorithm_references (
      id, problem_slug, solution_id, title, author, url, note, accessed_at, sort_order
    ) VALUES (
      'two-sum--reference', 'two-sum', 'two-sum--hash-map', 'Reference',
      'Author', 'https://example.com/reference', 'Scope note', '2026-07-26', 0
    )
  `).run();
  assert.equal(database.prepare("SELECT COUNT(*) AS count FROM algorithm_solutions WHERE problem_slug = 'two-sum'").get().count, 1);
  assert.equal(database.prepare(`
    SELECT COUNT(*) AS count
    FROM algorithm_code_blocks cb
    INNER JOIN algorithm_solutions s ON s.id = cb.solution_id
    WHERE s.problem_slug = 'two-sum'
  `).get().count, 1);
  assert.equal(database.prepare("SELECT COUNT(*) AS count FROM algorithm_problem_tags WHERE problem_slug = 'two-sum'").get().count, 1);
  assert.equal(database.prepare("SELECT COUNT(*) AS count FROM algorithm_references WHERE problem_slug = 'two-sum'").get().count, 1);
  database.prepare("DELETE FROM algorithm_problems WHERE slug = 'two-sum'").run();
  assert.equal(database.prepare("SELECT COUNT(*) AS count FROM algorithm_solutions WHERE problem_slug = 'two-sum'").get().count, 0);
  assert.equal(database.prepare(`
    SELECT COUNT(*) AS count
    FROM algorithm_code_blocks cb
    INNER JOIN algorithm_solutions s ON s.id = cb.solution_id
    WHERE s.problem_slug = 'two-sum'
  `).get().count, 0);
  assert.equal(database.prepare("SELECT COUNT(*) AS count FROM algorithm_problem_tags WHERE problem_slug = 'two-sum'").get().count, 0);
  assert.equal(database.prepare("SELECT COUNT(*) AS count FROM algorithm_references WHERE problem_slug = 'two-sum'").get().count, 0);
  database.exec("ROLLBACK");
  const profile = JSON.parse(database.prepare("SELECT value FROM site_settings WHERE key = 'profile'").get().value);
  assert.equal(profile.identity.shortName, "sharkdingo");
  assert.equal(profile.about.name, "sharkdingo");
  assert.match(profile.playground.constellation.emptyTitle, /第一篇文章/);
  assert.equal(profile.playground.constellation.articleCount, 4);
  assert.equal(profile.playground.constellation.connectionsPerArticle, 2);
  assert.equal(profile.playground.constellation.noiseBudget, 3);
  assert.equal(profile.playground.runner, undefined);
  assert.equal(profile.playground.fusion, undefined);
  assert.equal(profile.theme.dark.faint, "#8b9195");
  assert.equal(profile.theme.dark.lineStrong, "#687074");
  assert.equal(profile.theme.light.faint, "#6d7276");
  assert.equal(profile.theme.light.lineStrong, "#8b9094");
  assert.equal(profile.hero.image, "/images/hero-knowledge-garden.webp");
  assert.equal(profile.about.image.src, "/images/identity-landscape.webp");
  assert.ok(contrastRatio(profile.theme.dark.faint, profile.theme.dark.surface) >= 4.5);
  assert.ok(contrastRatio(profile.theme.light.faint, profile.theme.light.surface) >= 4.5);
  assert.ok(contrastRatio(profile.theme.dark.lineStrong, profile.theme.dark.surface) >= 3);
  assert.ok(contrastRatio(profile.theme.light.lineStrong, profile.theme.light.surface) >= 3);
  assert.deepEqual(profile.hero.titleLines, ["把复杂的问题，", "写成清晰的路径。"]);
  assert.equal(profile.hero.intro.enabled, true);
  assert.equal(profile.hero.intro.lines.length, 3);
  assert.equal(profile.hero.intro.replayLabel, "重播开场");
  assert.equal(profile.hero.intro.duration, 2200);
  assert.equal(profile.home.title, "第一次来，可以从这里开始");
  assert.equal(profile.home.continueLabel, "继续上次未读完的文章");
  assert.equal(profile.daily.timeZone, "Asia/Shanghai");
  assert.equal(profile.daily.modes.length, 3);
  assert.match(profile.daily.titleTemplate, /\{tag\}/);
  assert.equal(profile.engagement.enabled, true);
  assert.equal(profile.engagement.options.length, 4);
  assert.equal(profile.pages.algorithms.title, "算法题库");
  assert.equal(profile.algorithmHub.difficultyLabels.medium, "中等");
  assert.equal(profile.algorithmHub.overviewTitle, "解法一览");
  assert.equal(profile.algorithmHub.copyErrorLabel, "复制失败，请手动选择");
  assert.equal(profile.algorithmHub.implementationsLabel, "语言实现");
  assert.equal(profile.algorithmHub.referencesTitle, "参考与致谢");
  assert.equal(profile.algorithmAuthoring.defaultPlatformId, "leetcode");
  assert.equal(profile.algorithmAuthoring.platformPresets[0].label, "LeetCode");
  assert.deepEqual(
    profile.algorithmAuthoring.languagePresets.map((preset) => preset.id),
    ["cpp", "java", "python", "typescript"],
  );
  assert.match(profile.algorithmAuthoring.latexHelp, /\$\.\.\.\$/);
  assert.match(profile.algorithmHub.resultTemplate, /\{count\}/);
  assert.match(profile.algorithmHub.codeRegionTemplate, /\{language\}/);
  assert.match(profile.engagement.totalTemplate, /\{count\}/);
  assert.match(profile.engagement.thanksTemplate, /\{reaction\}/);
  assert.deepEqual(database.prepare("PRAGMA foreign_key_check").all(), []);
});

test("each published article has sections, tags, and a valid category", async () => {
  const database = await migratedDatabase();
  const incomplete = database.prepare(`
    SELECT a.slug
    FROM articles a
    LEFT JOIN article_sections s ON s.article_slug = a.slug
    LEFT JOIN article_tags at ON at.article_slug = a.slug
    LEFT JOIN categories c ON c.id = a.category_id
    WHERE a.status = 'published'
    GROUP BY a.slug
    HAVING COUNT(DISTINCT s.section_id) = 0
      OR COUNT(DISTINCT at.tag_id) = 0
      OR COUNT(DISTINCT c.id) = 0
  `).all();
  assert.deepEqual(incomplete, []);
});

test("each published algorithm note has complete explanations and runnable code sections", async () => {
  const database = await migratedDatabase();
  const incomplete = database.prepare(`
    SELECT p.slug
    FROM algorithm_problems p
    LEFT JOIN algorithm_solutions s ON s.problem_slug = p.slug
    LEFT JOIN algorithm_code_blocks cb ON cb.solution_id = s.id
    LEFT JOIN algorithm_problem_tags apt ON apt.problem_slug = p.slug
    WHERE p.status = 'published'
    GROUP BY p.slug
    HAVING p.title = ''
      OR p.statement = ''
      OR p.source_url NOT LIKE 'https://%'
      OR COUNT(DISTINCT s.id) = 0
      OR COUNT(DISTINCT cb.id) = 0
      OR COUNT(DISTINCT apt.tag_id) = 0
      OR MIN(LENGTH(s.proof)) = 0
      OR MIN(LENGTH(s.time_complexity)) = 0
      OR MIN(LENGTH(s.space_complexity)) = 0
  `).all();
  assert.deepEqual(incomplete, []);
  assert.deepEqual(database.prepare("PRAGMA foreign_key_check").all(), []);
});
