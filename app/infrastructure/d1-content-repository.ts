import { env } from "cloudflare:workers";
import type {
  ArticleDocument,
  ArticleRepository,
  Category,
  Project,
  ProjectRepository,
  SiteProfile,
  SiteProfileRepository,
  TaxonomyRepository,
} from "../domain/content";
import { parsePersistedSiteProfile } from "../domain/site-profile-schema";

type ArticleRow = {
  slug: string;
  title: string;
  summary: string;
  published_at: string;
  display_date: string;
  category: string;
  minutes: number;
  featured: number;
  lead: string;
  quote: string | null;
  callout_label: string | null;
  callout_lines: string | null;
};

type SectionRow = {
  article_slug: string;
  section_id: string;
  title: string;
  paragraphs: string;
};

type ArticleTagRow = {
  article_slug: string;
  name: string;
};

type ProjectRow = {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  status: string;
  status_label: string;
  category: string;
  stack: string;
  updated_at: string;
  visual: Project["visual"];
  related_article_slug: string | null;
  repository_url: string | null;
  demo_url: string | null;
};

type SettingRow = { key: string; value: string };
type NavigationRow = { id: string; href: string; label: string; location: string };

type SiteSettings = Omit<SiteProfile, "navigation" | "footer"> & {
  footer: Omit<SiteProfile["footer"], "links">;
};

function database(): D1Database {
  if (!env.DB) {
    throw new Error("Cloudflare D1 binding `DB` is required for site content.");
  }
  return env.DB;
}

function parseJson<T>(value: string, context: string): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    throw new Error(`Invalid JSON in ${context}.`);
  }
}

function rows<T>(result: D1Result<unknown>): T[] {
  return (result.results ?? []) as T[];
}

function mapArticle(
  article: ArticleRow,
  sectionRows: readonly SectionRow[],
  tagRows: readonly ArticleTagRow[],
): ArticleDocument {
  const calloutLines = article.callout_lines
    ? parseJson<string[]>(article.callout_lines, `article ${article.slug} callout`)
    : null;
  return {
    slug: article.slug,
    title: article.title,
    summary: article.summary,
    date: article.published_at,
    displayDate: article.display_date,
    year: article.published_at.slice(0, 4),
    category: article.category,
    minutes: article.minutes,
    featured: Boolean(article.featured),
    lead: article.lead,
    quote: article.quote ?? undefined,
    callout: article.callout_label && calloutLines
      ? { label: article.callout_label, lines: calloutLines }
      : undefined,
    tags: tagRows.filter((tag) => tag.article_slug === article.slug).map((tag) => tag.name),
    sections: sectionRows
      .filter((section) => section.article_slug === article.slug)
      .map((section) => ({
        id: section.section_id,
        title: section.title,
        paragraphs: parseJson<string[]>(
          section.paragraphs,
          `article ${article.slug} section ${section.section_id}`,
        ),
      })),
  };
}

export class D1ContentRepository
  implements ArticleRepository, ProjectRepository, TaxonomyRepository, SiteProfileRepository
{
  async listArticles(): Promise<ArticleDocument[]> {
    const d1 = database();
    const [articleResult, sectionResult, tagResult] = await d1.batch([
      d1.prepare(`
        SELECT
          a.slug, a.title, a.summary, a.published_at, a.display_date,
          c.name AS category, a.minutes, a.featured, a.lead, a.quote,
          a.callout_label, a.callout_lines
        FROM articles a
        INNER JOIN categories c ON c.id = a.category_id
        WHERE
          a.status = 'published'
          OR (a.status = 'scheduled' AND datetime(a.published_at) <= datetime('now'))
        ORDER BY a.published_at DESC
      `),
      d1.prepare(`
        SELECT article_slug, section_id, title, paragraphs
        FROM article_sections
        ORDER BY article_slug, sort_order
      `),
      d1.prepare(`
        SELECT article_tags.article_slug, tags.name
        FROM article_tags
        INNER JOIN tags ON tags.id = article_tags.tag_id
        ORDER BY article_tags.article_slug, tags.name
      `),
    ]);

    const sectionRows = rows<SectionRow>(sectionResult);
    const tagRows = rows<ArticleTagRow>(tagResult);

    return rows<ArticleRow>(articleResult).map((article) =>
      mapArticle(article, sectionRows, tagRows)
    );
  }

  async findArticleBySlug(slug: string): Promise<ArticleDocument | null> {
    const d1 = database();
    const [articleResult, sectionResult, tagResult] = await d1.batch([
      d1.prepare(`
        SELECT
          a.slug, a.title, a.summary, a.published_at, a.display_date,
          c.name AS category, a.minutes, a.featured, a.lead, a.quote,
          a.callout_label, a.callout_lines
        FROM articles a
        INNER JOIN categories c ON c.id = a.category_id
        WHERE a.slug = ?
          AND (
            a.status = 'published'
            OR (a.status = 'scheduled' AND datetime(a.published_at) <= datetime('now'))
          )
        LIMIT 1
      `).bind(slug),
      d1.prepare(`
        SELECT article_slug, section_id, title, paragraphs
        FROM article_sections
        WHERE article_slug = ?
        ORDER BY sort_order
      `).bind(slug),
      d1.prepare(`
        SELECT article_tags.article_slug, tags.name
        FROM article_tags
        INNER JOIN tags ON tags.id = article_tags.tag_id
        WHERE article_tags.article_slug = ?
        ORDER BY tags.name
      `).bind(slug),
    ]);
    const article = rows<ArticleRow>(articleResult)[0];
    return article
      ? mapArticle(article, rows<SectionRow>(sectionResult), rows<ArticleTagRow>(tagResult))
      : null;
  }

  async listProjects(): Promise<Project[]> {
    const result = await database().prepare(`
      SELECT
        p.id, p.name, p.subtitle, p.description, p.status, p.status_label,
        p.category, p.stack, p.updated_at, p.visual,
        CASE
          WHEN a.status = 'published'
            OR (a.status = 'scheduled' AND datetime(a.published_at) <= datetime('now'))
          THEN p.related_article_slug
        END AS related_article_slug,
        p.repository_url, p.demo_url
      FROM projects p
      LEFT JOIN articles a ON a.slug = p.related_article_slug
      WHERE p.archived = 0
      ORDER BY p.sort_order
    `).all<ProjectRow>();

    return rows<ProjectRow>(result).map((project) => ({
      id: project.id,
      name: project.name,
      subtitle: project.subtitle,
      description: project.description,
      status: project.status,
      statusLabel: project.status_label,
      category: project.category,
      stack: parseJson<string[]>(project.stack, `project ${project.name} stack`),
      updated: project.updated_at,
      visual: project.visual,
      relatedArticleSlug: project.related_article_slug ?? undefined,
      links: project.repository_url || project.demo_url
        ? {
            repository: project.repository_url ?? undefined,
            demo: project.demo_url ?? undefined,
          }
        : undefined,
    }));
  }

  async listCategories(): Promise<Category[]> {
    const result = await database().prepare(`
      SELECT
        c.name, c.name AS value, c.description,
        COUNT(CASE
          WHEN a.status = 'published'
            OR (a.status = 'scheduled' AND datetime(a.published_at) <= datetime('now'))
          THEN 1
        END) AS count
      FROM categories c
      LEFT JOIN articles a ON a.category_id = c.id
      GROUP BY c.id, c.name, c.description, c.sort_order
      ORDER BY c.sort_order
    `).all<Category>();
    return rows<Category>(result);
  }

  async listTags(): Promise<string[]> {
    const result = await database().prepare(`
      SELECT tags.name
      FROM tags
      INNER JOIN article_tags ON article_tags.tag_id = tags.id
      INNER JOIN articles ON articles.slug = article_tags.article_slug
      WHERE
        articles.status = 'published'
        OR (
          articles.status = 'scheduled'
          AND datetime(articles.published_at) <= datetime('now')
        )
      GROUP BY tags.id, tags.name
      ORDER BY tags.name
    `).all<{ name: string }>();
    return rows<{ name: string }>(result).map(({ name }) => name);
  }

  async getSiteProfile(): Promise<SiteProfile> {
    const d1 = database();
    const [settingsResult, navigationResult] = await d1.batch([
      d1.prepare("SELECT key, value FROM site_settings"),
      d1.prepare(`
        SELECT id, href, label, location
        FROM navigation_items
        ORDER BY location, sort_order
      `),
    ]);

    const settings = new Map(rows<SettingRow>(settingsResult).map((row) => [row.key, row.value]));
    const profileValue = settings.get("profile");
    if (!profileValue) throw new Error("Missing required site setting: profile.");
    const profile = parsePersistedSiteProfile(profileValue) as SiteSettings;
    const navigation = rows<NavigationRow>(navigationResult);

    return {
      ...profile,
      navigation: navigation
        .filter((item) => item.location === "header")
        .map(({ id, href, label }) => ({ id, href, label })),
      footer: {
        ...profile.footer,
        links: navigation
          .filter((item) => item.location === "footer")
          .map(({ id, href, label }) => ({ id, href, label })),
      },
    };
  }
}
