import { ArticleService } from "../application/article-service";
import { AlgorithmProblemService } from "../application/algorithm-problem-service";
import { ArticleEngagementService } from "../application/article-engagement-service";
import { DiscoveryService } from "../application/discovery-service";
import { DailyExperienceService } from "../application/daily-experience-service";
import { ProjectService } from "../application/project-service";
import { SiteService } from "../application/site-service";
import { StudioAccessService } from "../application/studio-access-service";
import { StudioArticleService } from "../application/studio-article-service";
import { StudioProjectService } from "../application/studio-project-service";
import { StudioAlgorithmProblemService } from "../application/studio-algorithm-service";
import { StudioSiteService } from "../application/studio-site-service";
import { D1ContentRepository } from "../infrastructure/d1-content-repository";
import { D1AlgorithmRepository } from "../infrastructure/d1-algorithm-repository";
import { D1EngagementRepository } from "../infrastructure/d1-engagement-repository";
import { D1StudioRepository } from "../infrastructure/d1-studio-repository";
import { D1SearchRepository } from "../infrastructure/d1-search-repository";
import { EnvironmentStudioAccessRepository } from "../infrastructure/environment-studio-access-repository";
import { StudioCategoryService } from "../application/studio-category-service";
import { StudioBackupService } from "../application/studio-backup-service";
import { D1StudioBackupRepository } from "../infrastructure/d1-studio-backup-repository";
import { StudioAuditService } from "../application/studio-audit-service";
import { StructuredStudioAuditRepository } from "../infrastructure/structured-studio-audit-repository";

const repository = new D1ContentRepository();
const algorithmRepository = new D1AlgorithmRepository();
const cachedRepository = {
  listArticles: cache(() => repository.listArticles()),
  findArticleBySlug: cache((slug: string) => repository.findArticleBySlug(slug)),
  listProjects: cache(() => repository.listProjects()),
  listCategories: cache(() => repository.listCategories()),
  listTags: cache(() => repository.listTags()),
  getSiteProfile: cache(() => repository.getSiteProfile()),
};
const articles = new ArticleService(cachedRepository);
const algorithms = new AlgorithmProblemService(algorithmRepository);
const projects = new ProjectService(cachedRepository);
const discovery = new DiscoveryService(cachedRepository, new D1SearchRepository());
const daily = new DailyExperienceService();
const site = new SiteService(cachedRepository);
const engagement = new ArticleEngagementService(
  cachedRepository,
  cachedRepository,
  new D1EngagementRepository(),
);
const studioRepository = new D1StudioRepository();
const studioAccess = new StudioAccessService(new EnvironmentStudioAccessRepository());
const studioArticles = new StudioArticleService(studioRepository);
const studioProjects = new StudioProjectService(studioRepository);
const studioAlgorithms = new StudioAlgorithmProblemService(algorithmRepository);
const studioSite = new StudioSiteService(studioRepository);
const studioCategories = new StudioCategoryService(studioRepository);
const studioBackup = new StudioBackupService(new D1StudioBackupRepository());
const studioAudit = new StudioAuditService(new StructuredStudioAuditRepository());

export const contentServices = Object.freeze({
  articles,
  algorithms,
  projects,
  discovery,
  daily,
  site,
  engagement,
  studio: Object.freeze({
    access: studioAccess,
    articles: studioArticles,
    algorithms: studioAlgorithms,
    projects: studioProjects,
    site: studioSite,
    categories: studioCategories,
    backup: studioBackup,
    audit: studioAudit,
  }),
});
import { cache } from "react";
