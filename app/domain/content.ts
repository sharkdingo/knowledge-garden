export type ArticleCategory = string;

export type ArticleSummary = {
  slug: string;
  title: string;
  summary: string;
  date: string;
  displayDate: string;
  year: string;
  category: ArticleCategory;
  minutes: number;
  tags: string[];
  featured?: boolean;
};

export type ArticleSection = {
  id: string;
  title: string;
  paragraphs: string[];
};

export type ArticleDocument = ArticleSummary & {
  lead: string;
  sections: ArticleSection[];
  callout?: {
    label: string;
    lines: string[];
  };
  quote?: string;
};

export type ArticleJourney = {
  previous: ArticleSummary | null;
  next: ArticleSummary | null;
  related: ArticleSummary[];
};

export type AlgorithmDifficulty = "easy" | "medium" | "hard";

export type AlgorithmCodeBlock = {
  id: string;
  language: string;
  label: string;
  code: string;
};

export type AlgorithmSolution = {
  id: string;
  title: string;
  intuition: string;
  steps: string[];
  proof: string;
  timeComplexity: string;
  spaceComplexity: string;
  pitfalls: string[];
  codeBlocks: AlgorithmCodeBlock[];
};

export type AlgorithmReference = {
  id: string;
  solutionId?: string;
  title: string;
  author: string;
  url: string;
  note: string;
  accessedAt: string;
};

export type AlgorithmProblemSummary = {
  slug: string;
  platform: string;
  problemId: string;
  title: string;
  difficulty: AlgorithmDifficulty;
  sourceUrl: string;
  summary: string;
  solvedAt: string;
  updatedAt: string;
  featured: boolean;
  tags: string[];
  solutionCount: number;
  languages: string[];
};

export type AlgorithmProblemDocument = AlgorithmProblemSummary & {
  statement: string;
  constraints: string[];
  solutions: AlgorithmSolution[];
  references: AlgorithmReference[];
};

export type AlgorithmPlatformPreset = {
  id: string;
  label: string;
  sourceHint: string;
};

export type AlgorithmLanguagePreset = {
  id: string;
  label: string;
};

export type AlgorithmAuthoringConfig = {
  defaultPlatformId: string;
  platformPresets: AlgorithmPlatformPreset[];
  languagePresets: AlgorithmLanguagePreset[];
  latexHelp: string;
  referenceHelp: string;
};

export type AlgorithmHubConfig = {
  archiveTitle: string;
  statsLabel: string;
  publishedStatLabel: string;
  solutionsStatLabel: string;
  languagesStatLabel: string;
  searchPlaceholder: string;
  difficultyFilterLabel: string;
  platformFilterLabel: string;
  allDifficultiesLabel: string;
  allPlatformsLabel: string;
  resultTemplate: string;
  noResultsTitle: string;
  clearFiltersLabel: string;
  emptyTitle: string;
  emptyDescription: string;
  difficultyLabels: Record<AlgorithmDifficulty, string>;
  solutionCountTemplate: string;
  sourceLabel: string;
  solvedLabel: string;
  hubLabel: string;
  missingTitle: string;
  problemEyebrow: string;
  approachesEyebrow: string;
  tocLabel: string;
  overviewTitle: string;
  approachLabel: string;
  implementationsLabel: string;
  statementTitle: string;
  constraintsTitle: string;
  solutionsTitle: string;
  intuitionTitle: string;
  stepsTitle: string;
  proofTitle: string;
  complexityTitle: string;
  timeLabel: string;
  spaceLabel: string;
  pitfallsTitle: string;
  codeTitle: string;
  codeLanguageLabel: string;
  codeRegionTemplate: string;
  copyLabel: string;
  copiedLabel: string;
  copyErrorLabel: string;
  referencesTitle: string;
  referenceAuthorLabel: string;
  referenceAccessedLabel: string;
  referenceGeneralLabel: string;
};

export type ProjectStatus = string;
export type ProjectCategory = string;

export type Project = {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  status: ProjectStatus;
  statusLabel: string;
  category: ProjectCategory;
  stack: string[];
  updated: string;
  visual: "iot" | "canvas" | "agent";
  relatedArticleSlug?: string;
  links?: {
    repository?: string;
    demo?: string;
  };
};

export type Category = {
  name: string;
  value: ArticleCategory;
  count: number;
  description: string;
};

export type SearchEntry = {
  title: string;
  detail: string;
  excerpt: string;
  href: string;
  type: "文章" | "项目" | "题解";
  tags: string[];
  keywords: string;
};

export type DailyResponseMode = {
  id: string;
  label: string;
  reply: string;
  target: "article" | "project" | "play";
  actionLabel: string;
};

export type DailyExperienceConfig = {
  timeZone: string;
  eyebrow: string;
  titleTemplate: string;
  description: string;
  articleLabel: string;
  projectLabel: string;
  visitTemplate: string;
  prompt: string;
  resetLabel: string;
  greetings: {
    morning: string;
    afternoon: string;
    evening: string;
  };
  modes: DailyResponseMode[];
};

export type DailyExperience = {
  dateKey: string;
  displayDate: string;
  dayOfYear: number;
  title: string;
  tag: string;
  article: ArticleSummary;
  project: Project | null;
};

export type ArticleReactionOption = {
  id: string;
  label: string;
  symbol: string;
  reply: string;
};

export type ArticleEngagementConfig = {
  enabled: boolean;
  eyebrow: string;
  title: string;
  description: string;
  loadingLabel: string;
  errorMessage: string;
  retryLabel: string;
  totalTemplate: string;
  thanksTemplate: string;
  privacyNote: string;
  removeLabel: string;
  removedMessage: string;
  options: ArticleReactionOption[];
};

export type ArticleReactionCount = {
  id: string;
  count: number;
};

export type ArticleEngagementSnapshot = {
  counts: ArticleReactionCount[];
  selectedId: string | null;
  total: number;
};

export type ArticleEngagementArticleSummary = {
  slug: string;
  title: string;
  total: number;
  counts: ArticleReactionCount[];
};

export type ArticleEngagementOverview = {
  total: number;
  articles: ArticleEngagementArticleSummary[];
};

export type NavigationItem = {
  id: string;
  href: string;
  label: string;
};

export type ThemeTokens = {
  bg: string;
  surface: string;
  surfaceStrong: string;
  text: string;
  textStrong: string;
  muted: string;
  faint: string;
  line: string;
  lineStrong: string;
  accent: string;
  accentInk: string;
  danger: string;
  onImage: string;
  onImageMuted: string;
  imageOverlay: string;
};

export type SiteTheme = {
  dark: ThemeTokens;
  light: ThemeTokens;
};

export type PageIntro = {
  eyebrow: string;
  title: string;
  description: string;
};

export type SocialLink = {
  label: string;
  href: string;
};

export type AboutContent = {
  intro: PageIntro;
  image: { src: string; alt: string };
  name: string;
  role: string;
  bio: string;
  quote: string;
  location: string;
  socials: SocialLink[];
  journey: Array<{ title: string; description: string; period: string }>;
  skills: Array<{ group: string; items: string[] }>;
  now: string[];
  values: Array<{ symbol: string; title: string; description: string; note: string }>;
};

export type PlaygroundContent = {
  intro: PageIntro;
  lead: string;
  constellation: {
    id: string;
    eyebrow: string;
    title: string;
    description: string;
    instructions: string;
    articleCount: number;
    connectionsPerArticle: number;
    noiseBudget: number;
    startLabel: string;
    completeTitle: string;
    completeMessage: string;
    secret: string;
    emptyTitle: string;
    emptyDescription: string;
  };
};

export type SiteProfile = {
  identity: {
    name: string;
    shortName: string;
    latinName: string;
    author: string;
    description: string;
    url: string;
    locale: string;
  };
  navigation: NavigationItem[];
  footer: {
    statement: string;
    links: NavigationItem[];
  };
  hero: {
    eyebrow: string;
    title: string;
    lead: string;
    image: string;
    imageAlt: string;
    caption: string;
    primaryAction: NavigationItem;
    secondaryAction: NavigationItem;
    titleLines?: string[];
    nowLabel: string;
    nowValue: string;
    scrollLabel: string;
    intro: {
      enabled: boolean;
      label: string;
      lines: string[];
      skipLabel: string;
      replayLabel: string;
      duration: number;
    };
  };
  home: {
    eyebrow: string;
    title: string;
    description: string;
    writingLabel: string;
    projectsLabel: string;
    topicsLabel: string;
    playgroundLabel: string;
    continueLabel: string;
  };
  daily: DailyExperienceConfig;
  engagement: ArticleEngagementConfig;
  algorithmHub: AlgorithmHubConfig;
  algorithmAuthoring: AlgorithmAuthoringConfig;
  pages: {
    writing: PageIntro;
    projects: PageIntro;
    explore: PageIntro;
    algorithms: PageIntro;
  };
  about: AboutContent;
  playground: PlaygroundContent;
  theme: SiteTheme;
  easterEggs: {
    konami: { title: string; message: string };
    brand: { title: string; message: string; clicks: number };
    console: { greeting: string };
  };
};

export interface ArticleRepository {
  listArticles(): Promise<readonly ArticleDocument[]>;
  findArticleBySlug(slug: string): Promise<ArticleDocument | null>;
}

export interface AlgorithmProblemRepository {
  listAlgorithmProblems(): Promise<readonly AlgorithmProblemSummary[]>;
  findAlgorithmProblemBySlug(slug: string): Promise<AlgorithmProblemDocument | null>;
}

export interface ProjectRepository {
  listProjects(): Promise<readonly Project[]>;
}

export interface TaxonomyRepository {
  listCategories(): Promise<readonly Category[]>;
  listTags(): Promise<readonly string[]>;
}

export interface SiteProfileRepository {
  getSiteProfile(): Promise<SiteProfile>;
}

export interface ArticleEngagementRepository {
  countArticleReactions(slug: string): Promise<readonly ArticleReactionCount[]>;
  findArticleReaction(slug: string, visitorKey: string): Promise<string | null>;
  saveArticleReaction(slug: string, visitorKey: string, reactionId: string): Promise<void>;
  deleteArticleReaction(slug: string, visitorKey: string): Promise<void>;
  getArticleEngagementOverview(limit: number): Promise<ArticleEngagementOverview>;
}
