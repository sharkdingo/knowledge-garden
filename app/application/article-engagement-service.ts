import type {
  ArticleEngagementConfig,
  ArticleEngagementOverview,
  ArticleEngagementRepository,
  ArticleEngagementSnapshot,
  ArticleRepository,
  SiteProfileRepository,
} from "../domain/content";

export class ArticleEngagementError extends Error {}

const VISITOR_KEY =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class ArticleEngagementService {
  constructor(
    private readonly articles: ArticleRepository,
    private readonly profiles: SiteProfileRepository,
    private readonly reactions: ArticleEngagementRepository,
  ) {}

  async getConfig(): Promise<ArticleEngagementConfig> {
    return (await this.profiles.getSiteProfile()).engagement;
  }

  async getSnapshot(slug: string, visitorKey?: string): Promise<ArticleEngagementSnapshot> {
    await this.requirePublishedArticle(slug);
    if (visitorKey) this.validateVisitorKey(visitorKey);
    return this.buildSnapshot(slug, visitorKey, await this.getConfig());
  }

  async react(
    slug: string,
    visitorKey: string,
    reactionId: string,
  ): Promise<ArticleEngagementSnapshot> {
    await this.requirePublishedArticle(slug);
    this.validateVisitorKey(visitorKey);
    const config = await this.getConfig();
    if (!config.enabled) throw new ArticleEngagementError("Reader responses are disabled.");
    if (!config.options.some((option) => option.id === reactionId)) {
      throw new ArticleEngagementError("Unknown reader response.");
    }
    await this.reactions.saveArticleReaction(slug, visitorKey, reactionId);
    return this.buildSnapshot(slug, visitorKey, config);
  }

  async remove(slug: string, visitorKey: string): Promise<ArticleEngagementSnapshot> {
    await this.requirePublishedArticle(slug);
    this.validateVisitorKey(visitorKey);
    const config = await this.getConfig();
    await this.reactions.deleteArticleReaction(slug, visitorKey);
    return this.buildSnapshot(slug, visitorKey, config);
  }

  async getOverview(limit = 5): Promise<ArticleEngagementOverview> {
    return this.reactions.getArticleEngagementOverview(Math.max(1, Math.min(limit, 20)));
  }

  private async requirePublishedArticle(slug: string): Promise<void> {
    if (!await this.articles.findArticleBySlug(slug)) {
      throw new ArticleEngagementError("Article not found.");
    }
  }

  private async buildSnapshot(
    slug: string,
    visitorKey: string | undefined,
    config: ArticleEngagementConfig,
  ): Promise<ArticleEngagementSnapshot> {
    const [persisted, selectedId] = await Promise.all([
      this.reactions.countArticleReactions(slug),
      visitorKey ? this.reactions.findArticleReaction(slug, visitorKey) : Promise.resolve(null),
    ]);
    const persistedCounts = new Map(persisted.map((item) => [item.id, item.count]));
    const counts = config.options.map((option) => ({
      id: option.id,
      count: persistedCounts.get(option.id) ?? 0,
    }));
    return {
      counts,
      selectedId: selectedId && config.options.some((option) => option.id === selectedId)
        ? selectedId
        : null,
      total: counts.reduce((sum, item) => sum + item.count, 0),
    };
  }

  private validateVisitorKey(visitorKey: string): void {
    if (!VISITOR_KEY.test(visitorKey)) {
      throw new ArticleEngagementError("Invalid anonymous visitor key.");
    }
  }
}
