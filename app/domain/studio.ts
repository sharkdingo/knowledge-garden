import type {
  AlgorithmCodeBlock,
  AlgorithmDifficulty,
  AlgorithmReference,
  AlgorithmSolution,
  ArticleSection,
  Project,
  SiteProfile,
} from "./content";

export type StudioArticleStatus = "draft" | "scheduled" | "published" | "archived";

export function isScheduledArticleLive(
  status: StudioArticleStatus,
  publishedAt: string,
  now = Date.now(),
): boolean {
  return status === "scheduled" && Date.parse(publishedAt) <= now;
}

export type StudioArticleSummary = {
  slug: string;
  title: string;
  status: StudioArticleStatus;
  categoryId: string;
  categoryName: string;
  publishedAt: string;
  updatedLabel: string;
  featured: boolean;
  version: number;
};

export type StudioRevisionReason =
  | "baseline"
  | "created"
  | "saved"
  | "scheduled"
  | "published"
  | "unpublished"
  | "archived"
  | "restored";

export type StudioArticleRevision = {
  id: string;
  articleSlug: string;
  title: string;
  status: StudioArticle["status"];
  reason: StudioRevisionReason;
  createdAt: string;
};

export type StudioArticleDraft = {
  articleSlug: string;
  input: StudioArticleInput;
  savedAt: string;
};

export type StudioArticle = StudioArticleSummary & {
  summary: string;
  displayDate: string;
  minutes: number;
  lead: string;
  quote: string;
  calloutLabel: string;
  calloutLines: string[];
  tags: string[];
  sections: ArticleSection[];
};

export type StudioArticleInput = Omit<
  StudioArticle,
  "categoryName" | "updatedLabel" | "version"
>;

export type StudioCategory = {
  id: string;
  name: string;
  description: string;
  sortOrder: number;
  articleCount: number;
};

export type StudioCategoryInput = Omit<StudioCategory, "articleCount">;

export type StudioCategoryDeleteResult = "deleted" | "in-use" | "missing";

export type StudioOverview = {
  articles: number;
  drafts: number;
  scheduled: number;
  published: number;
  archived: number;
  projects: number;
  archivedProjects: number;
};

export type StudioProject = Project & {
  sortOrder: number;
  archived: boolean;
  version: number;
};

export type StudioProjectInput = {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  status: string;
  statusLabel: string;
  category: string;
  stack: string[];
  updated: string;
  visual: Project["visual"];
  relatedArticleSlug?: string;
  repositoryUrl?: string;
  demoUrl?: string;
  sortOrder: number;
  archived: boolean;
};

export type StudioAlgorithmStatus = "draft" | "published" | "archived";

export type StudioAlgorithmProblemSummary = {
  slug: string;
  platform: string;
  problemId: string;
  title: string;
  difficulty: AlgorithmDifficulty;
  status: StudioAlgorithmStatus;
  solvedAt: string;
  updatedAt: string;
  solutionCount: number;
  version: number;
};

export type StudioAlgorithmProblem = StudioAlgorithmProblemSummary & {
  sourceUrl: string;
  summary: string;
  statement: string;
  constraints: string[];
  featured: boolean;
  tags: string[];
  solutions: AlgorithmSolution[];
  references: AlgorithmReference[];
};

export type StudioAlgorithmProblemInput = {
  slug: string;
  platform: string;
  problemId: string;
  title: string;
  difficulty: AlgorithmDifficulty;
  sourceUrl: string;
  summary: string;
  statement: string;
  constraints: string[];
  status: StudioAlgorithmStatus;
  solvedAt: string;
  featured: boolean;
  tags: string[];
  solutions: Array<Omit<AlgorithmSolution, "codeBlocks"> & {
    codeBlocks: AlgorithmCodeBlock[];
  }>;
  references: AlgorithmReference[];
};

export type StudioSiteSettings = {
  version: string;
  hero: {
    eyebrow: string;
    titleLines: string[];
    lead: string;
    caption: string;
    nowLabel: string;
    nowValue: string;
    primaryLabel: string;
    primaryHref: string;
    secondaryLabel: string;
    secondaryHref: string;
    introEnabled: boolean;
    introLabel: string;
    introLines: string[];
    introSkipLabel: string;
    introDuration: number;
  };
  home: SiteProfile["home"];
  daily: SiteProfile["daily"];
  engagement: SiteProfile["engagement"];
  algorithms: {
    page: SiteProfile["pages"]["algorithms"];
    hub: SiteProfile["algorithmHub"];
    authoring: SiteProfile["algorithmAuthoring"];
  };
  theme: {
    darkAccent: string;
    lightAccent: string;
  };
};

export interface StudioAccessRepository {
  isEditor(email: string): Promise<boolean>;
}

export interface StudioArticleRepository {
  getOverview(): Promise<StudioOverview>;
  listStudioArticles(): Promise<readonly StudioArticleSummary[]>;
  findStudioArticle(slug: string): Promise<StudioArticle | null>;
  listStudioCategories(): Promise<readonly StudioCategory[]>;
  createStudioArticle(input: StudioArticleInput): Promise<void>;
  updateStudioArticle(
    input: StudioArticleInput,
    expectedVersion: number,
    reason?: StudioRevisionReason,
  ): Promise<number | null>;
  archiveStudioArticle(slug: string, expectedVersion: number): Promise<number | null>;
  getStudioArticleDraft(slug: string): Promise<StudioArticleDraft | null>;
  saveStudioArticleDraft(input: StudioArticleInput): Promise<StudioArticleDraft>;
  deleteStudioArticleDraft(slug: string): Promise<void>;
  listStudioArticleRevisions(slug: string): Promise<readonly StudioArticleRevision[]>;
  findStudioArticleRevision(slug: string, revisionId: string): Promise<StudioArticleInput | null>;
}

export interface StudioCategoryRepository {
  listStudioCategories(): Promise<readonly StudioCategory[]>;
  findStudioCategory(id: string): Promise<StudioCategory | null>;
  createStudioCategory(input: StudioCategoryInput): Promise<void>;
  updateStudioCategory(input: StudioCategoryInput): Promise<void>;
  deleteStudioCategory(id: string): Promise<StudioCategoryDeleteResult>;
}

export interface StudioProjectRepository {
  listStudioProjects(): Promise<readonly StudioProject[]>;
  findStudioProject(id: string): Promise<StudioProject | null>;
  createStudioProject(input: StudioProjectInput): Promise<void>;
  updateStudioProject(input: StudioProjectInput, expectedVersion: number): Promise<number | null>;
  archiveStudioProject(id: string, expectedVersion: number): Promise<number | null>;
}

export interface StudioAlgorithmProblemRepository {
  listStudioAlgorithmProblems(): Promise<readonly StudioAlgorithmProblemSummary[]>;
  findStudioAlgorithmProblem(slug: string): Promise<StudioAlgorithmProblem | null>;
  createStudioAlgorithmProblem(input: StudioAlgorithmProblemInput): Promise<void>;
  updateStudioAlgorithmProblem(
    input: StudioAlgorithmProblemInput,
    expectedVersion: number,
  ): Promise<number | null>;
  archiveStudioAlgorithmProblem(slug: string, expectedVersion: number): Promise<number | null>;
}

export interface StudioSiteRepository {
  getEditableSiteSettings(): Promise<StudioSiteSettings>;
  updateEditableSiteSettings(settings: StudioSiteSettings): Promise<string | null>;
}

export type StudioExportSnapshot = {
  schemaVersion: 1;
  exportedAt: string;
  tables: Record<string, readonly Record<string, unknown>[]>;
};

export type StudioRestorePreview = {
  checksum: string;
  confirmationCode: string;
  exportedAt: string;
  totalRows: number;
  counts: Record<string, number>;
  warnings: string[];
};

export type StudioRestorePoint = {
  id: string;
  createdAt: string;
};

export interface StudioBackupRepository {
  exportSnapshot(): Promise<StudioExportSnapshot>;
  saveRestorePoint(snapshot: StudioExportSnapshot): Promise<string>;
  listRestorePoints(): Promise<readonly StudioRestorePoint[]>;
  findRestorePoint(id: string): Promise<StudioExportSnapshot | null>;
  restoreSnapshot(snapshot: StudioExportSnapshot): Promise<void>;
}

export type StudioAuditEvent = {
  action: string;
  resourceType: "article" | "category" | "problem" | "project" | "site" | "backup";
  resourceId: string;
  outcome: "succeeded" | "rejected";
  metadata?: Readonly<Record<string, string | number | boolean>>;
};

export interface StudioAuditRepository {
  record(actorEmail: string, event: StudioAuditEvent): Promise<void>;
}

export type EditableSiteProfile = SiteProfile & {
  hero: SiteProfile["hero"] & {
    intro: {
      enabled: boolean;
      label: string;
      lines: string[];
      skipLabel: string;
      replayLabel: string;
      duration: number;
    };
  };
};
