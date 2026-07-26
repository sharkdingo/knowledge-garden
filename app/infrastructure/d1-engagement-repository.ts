import { env } from "cloudflare:workers";
import type {
  ArticleEngagementOverview,
  ArticleEngagementRepository,
  ArticleReactionCount,
} from "../domain/content";

type CountRow = {
  reaction_id: string;
  count: number;
};

type OverviewRow = CountRow & {
  article_slug: string;
  title: string;
};

function database(): D1Database {
  if (!env.DB) throw new Error("Cloudflare D1 binding `DB` is required for reader responses.");
  return env.DB;
}

export class D1EngagementRepository implements ArticleEngagementRepository {
  async countArticleReactions(slug: string): Promise<ArticleReactionCount[]> {
    const result = await database().prepare(`
      SELECT reaction_id, COUNT(*) AS count
      FROM article_reactions
      WHERE article_slug = ?
      GROUP BY reaction_id
    `).bind(slug).all<CountRow>();
    return (result.results ?? []).map((row) => ({
      id: row.reaction_id,
      count: Number(row.count),
    }));
  }

  async findArticleReaction(slug: string, visitorKey: string): Promise<string | null> {
    const row = await database().prepare(`
      SELECT reaction_id
      FROM article_reactions
      WHERE article_slug = ? AND visitor_key = ?
      LIMIT 1
    `).bind(slug, visitorKey).first<{ reaction_id: string }>();
    return row?.reaction_id ?? null;
  }

  async saveArticleReaction(
    slug: string,
    visitorKey: string,
    reactionId: string,
  ): Promise<void> {
    const now = new Date().toISOString();
    await database().prepare(`
      INSERT INTO article_reactions (
        article_slug, visitor_key, reaction_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(article_slug, visitor_key) DO UPDATE SET
        reaction_id = excluded.reaction_id,
        updated_at = excluded.updated_at
    `).bind(slug, visitorKey, reactionId, now, now).run();
  }

  async deleteArticleReaction(slug: string, visitorKey: string): Promise<void> {
    await database().prepare(`
      DELETE FROM article_reactions
      WHERE article_slug = ? AND visitor_key = ?
    `).bind(slug, visitorKey).run();
  }

  async getArticleEngagementOverview(limit: number): Promise<ArticleEngagementOverview> {
    const d1 = database();
    const [totalResult, articleResult] = await d1.batch([
      d1.prepare("SELECT COUNT(*) AS total FROM article_reactions"),
      d1.prepare(`
        WITH top_articles AS (
          SELECT article_slug, COUNT(*) AS total
          FROM article_reactions
          GROUP BY article_slug
          ORDER BY total DESC, article_slug
          LIMIT ?
        )
        SELECT
          r.article_slug,
          a.title,
          r.reaction_id,
          COUNT(*) AS count
        FROM top_articles top
        INNER JOIN article_reactions r ON r.article_slug = top.article_slug
        INNER JOIN articles a ON a.slug = r.article_slug
        GROUP BY r.article_slug, a.title, r.reaction_id, top.total
        ORDER BY top.total DESC, a.title, r.reaction_id
      `).bind(limit),
    ]);
    const articles = new Map<string, ArticleEngagementOverview["articles"][number]>();
    for (const raw of articleResult.results ?? []) {
      const row = raw as OverviewRow;
      const count = Number(row.count);
      const current = articles.get(row.article_slug) ?? {
        slug: row.article_slug,
        title: row.title,
        total: 0,
        counts: [],
      };
      current.total += count;
      current.counts.push({ id: row.reaction_id, count });
      articles.set(row.article_slug, current);
    }
    return {
      total: Number((totalResult.results?.[0] as { total?: number } | undefined)?.total ?? 0),
      articles: [...articles.values()],
    };
  }
}
