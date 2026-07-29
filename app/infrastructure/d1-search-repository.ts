import { env } from "cloudflare:workers";
import type { SearchEntry } from "../domain/content";
import type { SearchRepository } from "../domain/search";

type SearchRow = {
  title: string;
  detail: string;
  excerpt: string;
  href: string;
  type: SearchEntry["type"];
  tags: string;
  keywords: string;
};

export class D1SearchRepository implements SearchRepository {
  async listSearchEntries(): Promise<SearchEntry[]> {
    if (!env.DB) throw new Error("Cloudflare D1 binding `DB` is required for search.");
    const result = await env.DB.prepare(`
      SELECT
        a.title,
        c.name || ' · ' || a.minutes || ' 分钟' AS detail,
        a.summary AS excerpt,
        '/writing/' || a.slug AS href,
        '文章' AS type,
        COALESCE(GROUP_CONCAT(DISTINCT t.name), '') AS tags,
        a.summary || ' ' || a.lead || ' ' || COALESCE(GROUP_CONCAT(DISTINCT t.name), '') AS keywords
      FROM articles a
      INNER JOIN categories c ON c.id = a.category_id
      LEFT JOIN article_tags at ON at.article_slug = a.slug
      LEFT JOIN tags t ON t.id = at.tag_id
      WHERE a.status = 'published'
        OR (a.status = 'scheduled' AND datetime(a.published_at) <= datetime('now'))
      GROUP BY a.slug
      UNION ALL
      SELECT
        p.name,
        p.subtitle,
        p.description,
        '/projects#project-' || p.id,
        '项目',
        p.category || ',' || REPLACE(REPLACE(p.stack, '["', ''), '"]', ''),
        p.description || ' ' || p.stack
      FROM projects p
      WHERE p.archived = 0
      UNION ALL
      SELECT
        ap.problem_id || '. ' || ap.title,
        ap.platform || ' · ' || COUNT(DISTINCT s.id) || ' 种解法',
        ap.summary,
        '/problems/' || ap.slug,
        '题解',
        ap.difficulty || ',' || COALESCE(GROUP_CONCAT(DISTINCT t2.name), ''),
        ap.platform || ' ' || ap.problem_id || ' ' || ap.summary || ' ' ||
          COALESCE(GROUP_CONCAT(DISTINCT t2.name), '')
      FROM algorithm_problems ap
      LEFT JOIN algorithm_solutions s ON s.problem_slug = ap.slug
      LEFT JOIN algorithm_problem_tags apt ON apt.problem_slug = ap.slug
      LEFT JOIN tags t2 ON t2.id = apt.tag_id
      WHERE ap.status = 'published'
      GROUP BY ap.slug
    `).all<SearchRow>();
    return (result.results ?? []).map((row) => ({
      ...row,
      tags: row.tags.split(",").map((value) => value.trim()).filter(Boolean),
    }));
  }
}
