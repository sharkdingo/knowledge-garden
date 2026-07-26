import { env } from "cloudflare:workers";
import type {
  EditableSiteProfile,
  StudioArticle,
  StudioArticleDraft,
  StudioArticleInput,
  StudioArticleRepository,
  StudioArticleRevision,
  StudioArticleSummary,
  StudioCategory,
  StudioOverview,
  StudioProject,
  StudioProjectInput,
  StudioProjectRepository,
  StudioSiteRepository,
  StudioSiteSettings,
  StudioRevisionReason,
} from "../domain/studio";

type ArticleRow = {
  slug: string;
  title: string;
  summary: string;
  published_at: string;
  display_date: string;
  category_id: string;
  category_name: string;
  minutes: number;
  featured: number;
  lead: string;
  quote: string | null;
  callout_label: string | null;
  callout_lines: string | null;
  status: "draft" | "scheduled" | "published" | "archived";
};

type SectionRow = {
  section_id: string;
  title: string;
  paragraphs: string;
};

type StudioProjectRow = {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  status: string;
  status_label: string;
  category: string;
  stack: string;
  updated_at: string;
  visual: StudioProject["visual"];
  related_article_slug: string | null;
  repository_url: string | null;
  demo_url: string | null;
  sort_order: number;
  archived: number;
};

function database(): D1Database {
  if (!env.DB) throw new Error("Cloudflare D1 binding `DB` is required for Studio.");
  return env.DB;
}

function parseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function mapSummary(row: ArticleRow): StudioArticleSummary {
  return {
    slug: row.slug,
    title: row.title,
    status: row.status,
    categoryId: row.category_id,
    categoryName: row.category_name,
    publishedAt: row.published_at,
    updatedLabel: row.display_date,
    featured: Boolean(row.featured),
  };
}

function toArticleInput(article: StudioArticle): StudioArticleInput {
  return {
    slug: article.slug,
    title: article.title,
    summary: article.summary,
    publishedAt: article.publishedAt,
    displayDate: article.displayDate,
    categoryId: article.categoryId,
    minutes: article.minutes,
    featured: article.featured,
    lead: article.lead,
    quote: article.quote,
    calloutLabel: article.calloutLabel,
    calloutLines: [...article.calloutLines],
    status: article.status,
    tags: [...article.tags],
    sections: article.sections.map((section) => ({
      ...section,
      paragraphs: [...section.paragraphs],
    })),
  };
}

export class D1StudioRepository
  implements
    StudioArticleRepository,
    StudioProjectRepository,
    StudioSiteRepository
{
  async getOverview(): Promise<StudioOverview> {
    const d1 = database();
    const [article, project] = await d1.batch([
      d1.prepare(`
        SELECT
          COUNT(*) AS articles,
          COUNT(CASE WHEN status = 'draft' THEN 1 END) AS drafts,
          COUNT(CASE
            WHEN status = 'scheduled' AND datetime(published_at) > datetime('now')
            THEN 1
          END) AS scheduled,
          COUNT(CASE
            WHEN status = 'published'
              OR (status = 'scheduled' AND datetime(published_at) <= datetime('now'))
            THEN 1
          END) AS published,
          COUNT(CASE WHEN status = 'archived' THEN 1 END) AS archived
        FROM articles
      `),
      d1.prepare(`
        SELECT
          COUNT(CASE WHEN archived = 0 THEN 1 END) AS projects,
          COUNT(CASE WHEN archived = 1 THEN 1 END) AS archivedProjects
        FROM projects
      `),
    ]);
    const articleCount = (article.results?.[0] ?? {}) as Partial<StudioOverview>;
    const projectCount = (project.results?.[0] ?? {}) as Partial<StudioOverview>;
    return {
      articles: Number(articleCount.articles ?? 0),
      drafts: Number(articleCount.drafts ?? 0),
      scheduled: Number(articleCount.scheduled ?? 0),
      published: Number(articleCount.published ?? 0),
      archived: Number(articleCount.archived ?? 0),
      projects: Number(projectCount.projects ?? 0),
      archivedProjects: Number(projectCount.archivedProjects ?? 0),
    };
  }

  async listStudioArticles(): Promise<StudioArticleSummary[]> {
    const result = await database().prepare(`
      SELECT
        a.slug, a.title, a.summary, a.published_at, a.display_date,
        a.category_id, c.name AS category_name, a.minutes, a.featured,
        a.lead, a.quote, a.callout_label, a.callout_lines, a.status
      FROM articles a
      INNER JOIN categories c ON c.id = a.category_id
      ORDER BY
        CASE a.status WHEN 'draft' THEN 0 WHEN 'scheduled' THEN 1 WHEN 'published' THEN 2 ELSE 3 END,
        a.published_at DESC
    `).all<ArticleRow>();
    return (result.results ?? []).map(mapSummary);
  }

  async findStudioArticle(slug: string): Promise<StudioArticle | null> {
    const d1 = database();
    const [articleResult, sectionsResult, tagsResult] = await d1.batch([
      d1.prepare(`
        SELECT
          a.slug, a.title, a.summary, a.published_at, a.display_date,
          a.category_id, c.name AS category_name, a.minutes, a.featured,
          a.lead, a.quote, a.callout_label, a.callout_lines, a.status
        FROM articles a
        INNER JOIN categories c ON c.id = a.category_id
        WHERE a.slug = ?
      `).bind(slug),
      d1.prepare(`
        SELECT section_id, title, paragraphs
        FROM article_sections
        WHERE article_slug = ?
        ORDER BY sort_order
      `).bind(slug),
      d1.prepare(`
        SELECT tags.name
        FROM article_tags
        INNER JOIN tags ON tags.id = article_tags.tag_id
        WHERE article_tags.article_slug = ?
        ORDER BY tags.name
      `).bind(slug),
    ]);
    const row = articleResult.results?.[0] as ArticleRow | undefined;
    if (!row) return null;
    return {
      ...mapSummary(row),
      summary: row.summary,
      displayDate: row.display_date,
      minutes: row.minutes,
      lead: row.lead,
      quote: row.quote ?? "",
      calloutLabel: row.callout_label ?? "",
      calloutLines: parseJson<string[]>(row.callout_lines, []),
      tags: (tagsResult.results ?? []).map((tag) => String((tag as { name: string }).name)),
      sections: (sectionsResult.results ?? []).map((section) => {
        const typed = section as SectionRow;
        return {
          id: typed.section_id,
          title: typed.title,
          paragraphs: parseJson<string[]>(typed.paragraphs, []),
        };
      }),
    };
  }

  async listStudioCategories(): Promise<StudioCategory[]> {
    const result = await database()
      .prepare("SELECT id, name FROM categories ORDER BY sort_order")
      .all<StudioCategory>();
    return result.results ?? [];
  }

  async createStudioArticle(input: StudioArticleInput): Promise<void> {
    const d1 = database();
    const relations = await this.prepareArticleRelations(d1, input);
    const revision = this.prepareRevision(d1, input, "created");
    await d1.batch([
      d1.prepare(`
        INSERT INTO articles (
          slug, title, summary, published_at, display_date, category_id, minutes,
          featured, lead, quote, callout_label, callout_lines, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        input.slug,
        input.title,
        input.summary,
        input.publishedAt,
        input.displayDate,
        input.categoryId,
        input.minutes,
        input.featured ? 1 : 0,
        input.lead,
        input.quote || null,
        input.calloutLabel || null,
        input.calloutLines.length ? JSON.stringify(input.calloutLines) : null,
        input.status,
      ),
      ...relations,
      revision,
    ]);
  }

  async updateStudioArticle(
    input: StudioArticleInput,
    reason: StudioRevisionReason = "saved",
  ): Promise<void> {
    const d1 = database();
    const previous = await this.findStudioArticle(input.slug);
    const existingRevision = await d1.prepare(`
      SELECT 1 AS found
      FROM article_revisions
      WHERE article_slug = ?
      LIMIT 1
    `).bind(input.slug).first<{ found: number }>();
    const relations = await this.prepareArticleRelations(d1, input);
    const revisionTime = Date.now();
    const baseline = previous && !existingRevision
      ? [this.prepareRevision(
          d1,
          toArticleInput(previous),
          "baseline",
          new Date(revisionTime - 1).toISOString(),
        )]
      : [];
    const revision = this.prepareRevision(
      d1,
      input,
      reason,
      new Date(revisionTime).toISOString(),
    );
    await d1.batch([
      d1.prepare(`
        UPDATE articles
        SET
          title = ?, summary = ?, published_at = ?, display_date = ?,
          category_id = ?, minutes = ?, featured = ?, lead = ?, quote = ?,
          callout_label = ?, callout_lines = ?, status = ?
        WHERE slug = ?
      `).bind(
        input.title,
        input.summary,
        input.publishedAt,
        input.displayDate,
        input.categoryId,
        input.minutes,
        input.featured ? 1 : 0,
        input.lead,
        input.quote || null,
        input.calloutLabel || null,
        input.calloutLines.length ? JSON.stringify(input.calloutLines) : null,
        input.status,
        input.slug,
      ),
      ...relations,
      ...baseline,
      revision,
    ]);
    await d1.prepare(`
      DELETE FROM article_revisions
      WHERE article_slug = ?
        AND id NOT IN (
          SELECT id
          FROM article_revisions
          WHERE article_slug = ?
          ORDER BY created_at DESC
          LIMIT 30
        )
    `).bind(input.slug, input.slug).run();
  }

  private prepareRevision(
    d1: D1Database,
    input: StudioArticleInput,
    reason: StudioRevisionReason,
    createdAt = new Date().toISOString(),
  ): D1PreparedStatement {
    return d1.prepare(`
      INSERT INTO article_revisions (
        id, article_slug, payload, reason, created_at
      ) VALUES (?, ?, ?, ?, ?)
    `).bind(
      `revision-${crypto.randomUUID()}`,
      input.slug,
      JSON.stringify(input),
      reason,
      createdAt,
    );
  }

  private async prepareArticleRelations(
    d1: D1Database,
    input: StudioArticleInput,
  ): Promise<D1PreparedStatement[]> {
    const tags = [...new Set(input.tags)];
    if (tags.length) {
      await d1.batch(tags.map((tag) =>
        d1.prepare(`
          INSERT INTO tags (id, name)
          VALUES (?, ?)
          ON CONFLICT(name) DO NOTHING
        `).bind(`tag-${crypto.randomUUID()}`, tag)
      ));
    }
    const tagRows = tags.length
      ? await d1.prepare(
          `SELECT id, name FROM tags WHERE name IN (${tags.map(() => "?").join(", ")})`,
        ).bind(...tags).all<{ id: string; name: string }>()
      : { results: [] as { id: string; name: string }[] };

    return [
      d1.prepare("DELETE FROM article_sections WHERE article_slug = ?").bind(input.slug),
      d1.prepare("DELETE FROM article_tags WHERE article_slug = ?").bind(input.slug),
      ...input.sections.map((section, index) =>
        d1.prepare(`
          INSERT INTO article_sections (
            article_slug, section_id, title, paragraphs, sort_order
          ) VALUES (?, ?, ?, ?, ?)
        `).bind(input.slug, section.id, section.title, JSON.stringify(section.paragraphs), index)
      ),
      ...(tagRows.results ?? []).map((tag) =>
        d1.prepare(
          "INSERT INTO article_tags (article_slug, tag_id) VALUES (?, ?)",
        ).bind(input.slug, tag.id)
      ),
    ];
  }

  async archiveStudioArticle(slug: string): Promise<void> {
    const article = await this.findStudioArticle(slug);
    if (!article) return;
    await this.updateStudioArticle(
      { ...toArticleInput(article), status: "archived" },
      "archived",
    );
    await this.deleteStudioArticleDraft(slug);
  }

  async getStudioArticleDraft(slug: string): Promise<StudioArticleDraft | null> {
    const row = await database().prepare(`
      SELECT article_slug, payload, saved_at
      FROM article_drafts
      WHERE article_slug = ?
      LIMIT 1
    `).bind(slug).first<{
      article_slug: string;
      payload: string;
      saved_at: string;
    }>();
    if (!row) return null;
    const input = parseJson<StudioArticleInput | null>(row.payload, null);
    return input
      ? { articleSlug: row.article_slug, input, savedAt: row.saved_at }
      : null;
  }

  async saveStudioArticleDraft(input: StudioArticleInput): Promise<StudioArticleDraft> {
    const savedAt = new Date().toISOString();
    await database().prepare(`
      INSERT INTO article_drafts (article_slug, payload, saved_at)
      VALUES (?, ?, ?)
      ON CONFLICT(article_slug) DO UPDATE SET
        payload = excluded.payload,
        saved_at = excluded.saved_at
    `).bind(input.slug, JSON.stringify(input), savedAt).run();
    return { articleSlug: input.slug, input, savedAt };
  }

  async deleteStudioArticleDraft(slug: string): Promise<void> {
    await database()
      .prepare("DELETE FROM article_drafts WHERE article_slug = ?")
      .bind(slug)
      .run();
  }

  async listStudioArticleRevisions(slug: string): Promise<StudioArticleRevision[]> {
    const result = await database().prepare(`
      SELECT id, article_slug, payload, reason, created_at
      FROM article_revisions
      WHERE article_slug = ?
      ORDER BY created_at DESC
      LIMIT 30
    `).bind(slug).all<{
      id: string;
      article_slug: string;
      payload: string;
      reason: StudioRevisionReason;
      created_at: string;
    }>();
    return (result.results ?? []).flatMap((row) => {
      const input = parseJson<StudioArticleInput | null>(row.payload, null);
      return input ? [{
        id: row.id,
        articleSlug: row.article_slug,
        title: input.title,
        status: input.status,
        reason: row.reason,
        createdAt: row.created_at,
      }] : [];
    });
  }

  async findStudioArticleRevision(
    slug: string,
    revisionId: string,
  ): Promise<StudioArticleInput | null> {
    const row = await database().prepare(`
      SELECT payload
      FROM article_revisions
      WHERE article_slug = ? AND id = ?
      LIMIT 1
    `).bind(slug, revisionId).first<{ payload: string }>();
    return row ? parseJson<StudioArticleInput | null>(row.payload, null) : null;
  }

  async listStudioProjects(): Promise<StudioProject[]> {
    const result = await database().prepare(`
      SELECT
        id, name, subtitle, description, status, status_label, category, stack,
        updated_at, visual, related_article_slug, repository_url, demo_url,
        sort_order, archived
      FROM projects
      ORDER BY archived, sort_order, name
    `).all<StudioProjectRow>();
    return (result.results ?? []).map((row) => this.mapStudioProject(row));
  }

  async findStudioProject(id: string): Promise<StudioProject | null> {
    const row = await database().prepare(`
      SELECT
        id, name, subtitle, description, status, status_label, category, stack,
        updated_at, visual, related_article_slug, repository_url, demo_url,
        sort_order, archived
      FROM projects
      WHERE id = ?
      LIMIT 1
    `).bind(id).first<StudioProjectRow>();
    return row ? this.mapStudioProject(row) : null;
  }

  private mapStudioProject(row: StudioProjectRow): StudioProject {
    return {
      id: row.id,
      name: row.name,
      subtitle: row.subtitle,
      description: row.description,
      status: row.status,
      statusLabel: row.status_label,
      category: row.category,
      stack: parseJson<string[]>(row.stack, []),
      updated: row.updated_at,
      visual: row.visual,
      relatedArticleSlug: row.related_article_slug ?? undefined,
      links: row.repository_url || row.demo_url
        ? {
            repository: row.repository_url ?? undefined,
            demo: row.demo_url ?? undefined,
          }
        : undefined,
      sortOrder: row.sort_order,
      archived: Boolean(row.archived),
    };
  }

  async createStudioProject(input: StudioProjectInput): Promise<void> {
    await database().prepare(`
      INSERT INTO projects (
        id, name, subtitle, description, status, status_label, category, stack,
        updated_at, visual, related_article_slug, repository_url, demo_url,
        sort_order, archived
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      input.id,
      input.name,
      input.subtitle,
      input.description,
      input.status,
      input.statusLabel,
      input.category,
      JSON.stringify(input.stack),
      input.updated,
      input.visual,
      input.relatedArticleSlug || null,
      input.repositoryUrl || null,
      input.demoUrl || null,
      input.sortOrder,
      input.archived ? 1 : 0,
    ).run();
  }

  async updateStudioProject(input: StudioProjectInput): Promise<void> {
    await database().prepare(`
      UPDATE projects
      SET
        name = ?, subtitle = ?, description = ?, status = ?, status_label = ?,
        category = ?, stack = ?, updated_at = ?, visual = ?,
        related_article_slug = ?, repository_url = ?, demo_url = ?,
        sort_order = ?, archived = ?
      WHERE id = ?
    `).bind(
      input.name,
      input.subtitle,
      input.description,
      input.status,
      input.statusLabel,
      input.category,
      JSON.stringify(input.stack),
      input.updated,
      input.visual,
      input.relatedArticleSlug || null,
      input.repositoryUrl || null,
      input.demoUrl || null,
      input.sortOrder,
      input.archived ? 1 : 0,
      input.id,
    ).run();
  }

  async archiveStudioProject(id: string): Promise<void> {
    await database()
      .prepare("UPDATE projects SET archived = 1 WHERE id = ?")
      .bind(id)
      .run();
  }

  async getEditableSiteSettings(): Promise<StudioSiteSettings> {
    const row = await database()
      .prepare("SELECT value FROM site_settings WHERE key = 'profile'")
      .first<{ value: string }>();
    if (!row) throw new Error("Missing required site setting: profile.");
    const profile = parseJson<EditableSiteProfile | null>(row.value, null);
    if (!profile) throw new Error("Invalid site profile.");
    return {
      hero: {
        eyebrow: profile.hero.eyebrow,
        titleLines: profile.hero.titleLines,
        lead: profile.hero.lead,
        caption: profile.hero.caption,
        nowLabel: profile.hero.nowLabel,
        nowValue: profile.hero.nowValue,
        primaryLabel: profile.hero.primaryAction.label,
        primaryHref: profile.hero.primaryAction.href,
        secondaryLabel: profile.hero.secondaryAction.label,
        secondaryHref: profile.hero.secondaryAction.href,
        introEnabled: profile.hero.intro.enabled,
        introLabel: profile.hero.intro.label,
        introLines: profile.hero.intro.lines,
        introSkipLabel: profile.hero.intro.skipLabel,
        introDuration: profile.hero.intro.duration,
      },
      home: profile.home,
      daily: profile.daily,
      engagement: profile.engagement,
      algorithms: {
        page: profile.pages.algorithms,
        hub: profile.algorithmHub,
        authoring: profile.algorithmAuthoring,
      },
      theme: {
        darkAccent: profile.theme.dark.accent,
        lightAccent: profile.theme.light.accent,
      },
    };
  }

  async updateEditableSiteSettings(settings: StudioSiteSettings): Promise<void> {
    const d1 = database();
    const row = await d1
      .prepare("SELECT value FROM site_settings WHERE key = 'profile'")
      .first<{ value: string }>();
    if (!row) throw new Error("Missing required site setting: profile.");
    const profile = parseJson<EditableSiteProfile | null>(row.value, null);
    if (!profile) throw new Error("Invalid site profile.");
    const next: EditableSiteProfile = {
      ...profile,
      home: settings.home,
      daily: settings.daily,
      engagement: settings.engagement,
      algorithmHub: settings.algorithms.hub,
      algorithmAuthoring: settings.algorithms.authoring,
      pages: {
        ...profile.pages,
        algorithms: settings.algorithms.page,
      },
      hero: {
        ...profile.hero,
        eyebrow: settings.hero.eyebrow,
        title: settings.hero.titleLines.join(" "),
        titleLines: settings.hero.titleLines,
        lead: settings.hero.lead,
        caption: settings.hero.caption,
        nowLabel: settings.hero.nowLabel,
        nowValue: settings.hero.nowValue,
        primaryAction: {
          ...profile.hero.primaryAction,
          label: settings.hero.primaryLabel,
          href: settings.hero.primaryHref,
        },
        secondaryAction: {
          ...profile.hero.secondaryAction,
          label: settings.hero.secondaryLabel,
          href: settings.hero.secondaryHref,
        },
        intro: {
          ...profile.hero.intro,
          enabled: settings.hero.introEnabled,
          label: settings.hero.introLabel,
          lines: settings.hero.introLines,
          skipLabel: settings.hero.introSkipLabel,
          duration: settings.hero.introDuration,
        },
      },
      theme: {
        ...profile.theme,
        dark: { ...profile.theme.dark, accent: settings.theme.darkAccent },
        light: { ...profile.theme.light, accent: settings.theme.lightAccent },
      },
    };
    const reactionIds = settings.engagement.options.map((option) => option.id);
    const reactionPlaceholders = reactionIds.map(() => "?").join(", ");
    await d1.batch([
      d1.prepare(`
        UPDATE site_settings
        SET value = ?, updated_at = ?
        WHERE key = 'profile'
      `).bind(JSON.stringify(next), new Date().toISOString()),
      d1.prepare(`
        DELETE FROM article_reactions
        WHERE reaction_id NOT IN (${reactionPlaceholders})
      `).bind(...reactionIds),
    ]);
  }
}
