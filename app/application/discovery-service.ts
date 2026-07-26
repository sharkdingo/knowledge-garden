import type { SearchEntry, TaxonomyRepository } from "../domain/content";
import type { ArticleService } from "./article-service";
import type { ProjectService } from "./project-service";
import type { AlgorithmProblemService } from "./algorithm-problem-service";

export class DiscoveryService {
  constructor(
    private readonly articles: ArticleService,
    private readonly projects: ProjectService,
    private readonly algorithms: AlgorithmProblemService,
    private readonly taxonomy: TaxonomyRepository,
  ) {}

  async getTaxonomy() {
    const [categories, tags] = await Promise.all([
      this.taxonomy.listCategories(),
      this.taxonomy.listTags(),
    ]);
    return { categories: [...categories], tags: [...tags] };
  }

  async buildSearchIndex(): Promise<SearchEntry[]> {
    const [articles, projects, algorithms] = await Promise.all([
      this.articles.listSearchable(),
      this.projects.list(),
      this.algorithms.listSearchable(),
    ]);
    return [
      ...articles.map((article) => ({
        title: article.title,
        detail: `${article.category} · ${article.minutes} 分钟`,
        excerpt: article.summary,
        href: `/writing/${article.slug}`,
        type: "文章" as const,
        tags: [...article.tags],
        keywords: [
          article.summary,
          article.tags.join(" "),
          article.lead,
          ...article.sections.flatMap((section) => [
            section.title,
            ...section.paragraphs,
          ]),
        ].join(" "),
      })),
      ...projects.map((project) => ({
        title: project.name,
        detail: project.subtitle,
        excerpt: project.description,
        href: `/projects#project-${project.id}`,
        type: "项目" as const,
        tags: [project.category, ...project.stack],
        keywords: `${project.description} ${project.stack.join(" ")}`,
      })),
      ...algorithms.map((problem) => ({
        title: `${problem.problemId}. ${problem.title}`,
        detail: `${problem.platform} · ${problem.solutionCount} 种解法`,
        excerpt: problem.summary,
        href: `/problems/${problem.slug}`,
        type: "题解" as const,
        tags: [...problem.tags, problem.difficulty, ...problem.languages],
        keywords: [
          problem.platform,
          problem.problemId,
          problem.summary,
          problem.tags.join(" "),
          problem.languages.join(" "),
        ].join(" "),
      })),
    ];
  }
}
