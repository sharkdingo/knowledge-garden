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
import { EnvironmentStudioAccessRepository } from "../infrastructure/environment-studio-access-repository";

const repository = new D1ContentRepository();
const algorithmRepository = new D1AlgorithmRepository();
const articles = new ArticleService(repository);
const algorithms = new AlgorithmProblemService(algorithmRepository);
const projects = new ProjectService(repository);
const discovery = new DiscoveryService(articles, projects, algorithms, repository);
const daily = new DailyExperienceService();
const site = new SiteService(repository);
const engagement = new ArticleEngagementService(
  repository,
  repository,
  new D1EngagementRepository(),
);
const studioRepository = new D1StudioRepository();
const studioAccess = new StudioAccessService(new EnvironmentStudioAccessRepository());
const studioArticles = new StudioArticleService(studioRepository);
const studioProjects = new StudioProjectService(studioRepository);
const studioAlgorithms = new StudioAlgorithmProblemService(algorithmRepository);
const studioSite = new StudioSiteService(studioRepository);

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
  }),
});
