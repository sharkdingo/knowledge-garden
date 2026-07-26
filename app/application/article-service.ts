import type {
  ArticleDocument,
  ArticleJourney,
  ArticleRepository,
  ArticleSummary,
} from "../domain/content";

function toArticleSummary(article: ArticleDocument): ArticleSummary {
  return {
    slug: article.slug,
    title: article.title,
    summary: article.summary,
    date: article.date,
    displayDate: article.displayDate,
    year: article.year,
    category: article.category,
    minutes: article.minutes,
    tags: [...article.tags],
    featured: article.featured,
  };
}

export class ArticleService {
  constructor(private readonly repository: ArticleRepository) {}

  async listSearchable(): Promise<ArticleDocument[]> {
    return [...await this.repository.listArticles()];
  }

  async list(): Promise<ArticleSummary[]> {
    return (await this.listSearchable())
      .sort((left, right) => right.date.localeCompare(left.date))
      .map(toArticleSummary);
  }

  async listFeatured(limit = 3): Promise<ArticleSummary[]> {
    return (await this.list()).filter((article) => article.featured).slice(0, limit);
  }

  get(slug: string): Promise<ArticleDocument | null> {
    return this.repository.findArticleBySlug(slug);
  }

  private journeyFor(articles: ArticleSummary[], slug: string): ArticleJourney {
    const index = articles.findIndex((article) => article.slug === slug);
    if (index < 0) return { previous: null, next: null, related: [] };
    const current = articles[index];
    const score = (candidate: ArticleSummary) => {
      const sharedTags = candidate.tags.filter((tag) => current.tags.includes(tag)).length;
      return sharedTags * 4 + (candidate.category === current.category ? 2 : 0);
    };
    return {
      previous: articles[index + 1] ?? null,
      next: articles[index - 1] ?? null,
      related: articles
        .filter((article) => article.slug !== slug)
        .map((article) => ({ article, relevance: score(article) }))
        .filter(({ relevance }) => relevance > 0)
        .sort((left, right) =>
          right.relevance - left.relevance ||
          right.article.date.localeCompare(left.article.date)
        )
        .slice(0, 3)
        .map(({ article }) => article),
    };
  }

  async getJourney(slug: string): Promise<ArticleJourney> {
    const articles = await this.list();
    return this.journeyFor(articles, slug);
  }

  async getReadingView(slug: string): Promise<{
    article: ArticleDocument | null;
    journey: ArticleJourney;
  }> {
    const documents = await this.listSearchable();
    const article = documents.find((item) => item.slug === slug) ?? null;
    const summaries = documents
      .sort((left, right) => right.date.localeCompare(left.date))
      .map(toArticleSummary);
    return {
      article,
      journey: this.journeyFor(summaries, slug),
    };
  }

  async listSlugs(): Promise<string[]> {
    return (await this.repository.listArticles()).map((article) => article.slug);
  }
}
