import type {
  StudioArticle,
  StudioArticleDraft,
  StudioArticleInput,
  StudioArticleRepository,
  StudioRevisionReason,
} from "../domain/studio";
import { StudioValidationError } from "./studio-validation";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const STATUS = new Set(["draft", "scheduled", "published", "archived"]);

export { StudioValidationError } from "./studio-validation";

function required(value: unknown, label: string, max: number): string {
  const normalized = typeof value === "string" ? value.trim() : "";
  if (!normalized) throw new StudioValidationError(`${label}不能为空。`);
  if (normalized.length > max) {
    throw new StudioValidationError(`${label}不能超过 ${max} 个字符。`);
  }
  return normalized;
}

function optional(value: unknown, max: number): string {
  const normalized = typeof value === "string" ? value.trim() : "";
  if (normalized.length > max) {
    throw new StudioValidationError(`可选内容不能超过 ${max} 个字符。`);
  }
  return normalized;
}

function normalize(input: StudioArticleInput): StudioArticleInput {
  if (
    !input ||
    typeof input !== "object" ||
    !Array.isArray(input.calloutLines) ||
    !Array.isArray(input.tags) ||
    !Array.isArray(input.sections)
  ) {
    throw new StudioValidationError("文章结构不完整，请刷新页面后重试。");
  }
  const slug = required(input.slug, "Slug", 80).toLowerCase();
  if (!SLUG_PATTERN.test(slug) || slug.length > 80) {
    throw new StudioValidationError("Slug 只能包含小写字母、数字和单个连字符。");
  }
  if (!STATUS.has(input.status)) throw new StudioValidationError("文章状态无效。");
  if (
    typeof input.publishedAt !== "string" ||
    !/^\d{4}-\d{2}-\d{2}/.test(input.publishedAt)
  ) {
    throw new StudioValidationError("发布日期格式无效。");
  }
  if (!Number.isInteger(input.minutes) || input.minutes < 1 || input.minutes > 240) {
    throw new StudioValidationError("阅读时间需要在 1–240 分钟之间。");
  }
  if (!input.sections.length) throw new StudioValidationError("文章至少需要一个章节。");
  const requiresPublicationContent = input.status === "published" || input.status === "scheduled";

  const sectionIds = new Set<string>();
  const sections = input.sections.map((section, index) => {
    if (!section || typeof section !== "object" || !Array.isArray(section.paragraphs)) {
      throw new StudioValidationError(`第 ${index + 1} 个章节结构不完整。`);
    }
    const id = required(section.id, `第 ${index + 1} 个章节锚点`, 80)
      .toLowerCase();
    if (!SLUG_PATTERN.test(id)) {
      throw new StudioValidationError(`第 ${index + 1} 个章节的锚点格式无效。`);
    }
    if (sectionIds.has(id)) throw new StudioValidationError("章节锚点不能重复。");
    sectionIds.add(id);
    const paragraphs = section.paragraphs
      .map((paragraph) => optional(paragraph, 10_000))
      .filter(Boolean);
    if (requiresPublicationContent && !paragraphs.length) {
      throw new StudioValidationError(`第 ${index + 1} 个章节至少需要一段正文。`);
    }
    return {
      id,
      title: requiresPublicationContent
        ? required(section.title, `第 ${index + 1} 个章节标题`, 120)
        : optional(section.title, 120),
      paragraphs,
    };
  });

  return {
    ...input,
    slug,
    title: requiresPublicationContent
      ? required(input.title, "标题", 160)
      : optional(input.title, 160),
    summary: requiresPublicationContent
      ? required(input.summary, "摘要", 320)
      : optional(input.summary, 320),
    categoryId: required(input.categoryId, "分类", 80),
    displayDate: requiresPublicationContent
      ? required(input.displayDate, "显示日期", 40)
      : optional(input.displayDate, 40),
    lead: requiresPublicationContent
      ? required(input.lead, "导语", 600)
      : optional(input.lead, 600),
    quote: optional(input.quote, 500),
    calloutLabel: optional(input.calloutLabel, 80),
    calloutLines: input.calloutLines
      .map((line) => optional(line, 500))
      .filter(Boolean),
    tags: [
      ...new Set(input.tags.map((tag) => optional(tag, 60)).filter(Boolean)),
    ].slice(0, 12),
    sections,
  };
}

export class StudioArticleService {
  constructor(private readonly repository: StudioArticleRepository) {}

  getOverview() {
    return this.repository.getOverview();
  }

  async list() {
    return [...await this.repository.listStudioArticles()];
  }

  get(slug: string): Promise<StudioArticle | null> {
    return this.repository.findStudioArticle(slug);
  }

  async categories() {
    return [...await this.repository.listStudioCategories()];
  }

  async create(input: StudioArticleInput): Promise<string> {
    const normalized = normalize(input);
    if (await this.repository.findStudioArticle(normalized.slug)) {
      throw new StudioValidationError("这个 Slug 已经被使用。");
    }
    await this.repository.createStudioArticle(normalized);
    await this.repository.deleteStudioArticleDraft(normalized.slug);
    return normalized.slug;
  }

  async update(slug: string, input: StudioArticleInput) {
    const normalized = normalize(input);
    if (normalized.slug !== slug) {
      throw new StudioValidationError("已发布文章的 Slug 不能直接修改。");
    }
    const existing = await this.repository.findStudioArticle(slug);
    if (!existing) {
      throw new StudioValidationError("找不到需要更新的文章。");
    }
    let reason: StudioRevisionReason = "saved";
    if (normalized.status === "scheduled" && existing.status !== "scheduled") reason = "scheduled";
    else if (normalized.status === "published" && existing.status !== "published") reason = "published";
    else if (
      normalized.status === "draft" &&
      (existing.status === "published" || existing.status === "scheduled")
    ) reason = "unpublished";
    await this.repository.updateStudioArticle(normalized, reason);
    await this.repository.deleteStudioArticleDraft(slug);
  }

  archive(slug: string) {
    return this.repository.archiveStudioArticle(slug);
  }

  draft(slug: string): Promise<StudioArticleDraft | null> {
    return this.repository.getStudioArticleDraft(slug);
  }

  async autosave(slug: string, input: StudioArticleInput) {
    if (!STATUS.has(input.status)) throw new StudioValidationError("文章状态无效。");
    const normalized = {
      ...normalize({ ...input, status: "draft" }),
      status: input.status,
    };
    if (normalized.slug !== slug) {
      throw new StudioValidationError("自动保存的文章地址不匹配。");
    }
    if (!await this.repository.findStudioArticle(slug)) {
      throw new StudioValidationError("请先创建草稿，再启用自动保存。");
    }
    return this.repository.saveStudioArticleDraft(normalized);
  }

  discardDraft(slug: string) {
    return this.repository.deleteStudioArticleDraft(slug);
  }

  revisions(slug: string) {
    return this.repository.listStudioArticleRevisions(slug);
  }

  async restore(slug: string, revisionId: string): Promise<StudioArticle> {
    const revision = await this.repository.findStudioArticleRevision(slug, revisionId);
    if (!revision) throw new StudioValidationError("找不到需要恢复的版本。");
    const normalized = normalize(revision);
    await this.repository.updateStudioArticle(normalized, "restored");
    await this.repository.deleteStudioArticleDraft(slug);
    const restored = await this.repository.findStudioArticle(slug);
    if (!restored) throw new StudioValidationError("版本恢复后无法读取文章。");
    return restored;
  }
}
