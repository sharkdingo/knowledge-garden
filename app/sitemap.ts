import type { MetadataRoute } from "next";
import { contentServices } from "./composition/content";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articlesData, problemsData, profile] = await Promise.all([
    contentServices.articles.list(),
    contentServices.algorithms.list(),
    contentServices.site.getProfile(),
  ]);
  const siteUrl = profile.identity.url;
  const pages = ["", "/writing", "/problems", "/projects", "/about", "/explore", "/play"].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "weekly" as const : "monthly" as const,
    priority: path === "" ? 1 : 0.8,
  }));

  const articles = articlesData.map((article) => ({
    url: `${siteUrl}/writing/${article.slug}`,
    lastModified: new Date(`${article.date}T00:00:00+08:00`),
    changeFrequency: "yearly" as const,
    priority: 0.7,
  }));

  const problems = problemsData.map((problem) => ({
    url: `${siteUrl}/problems/${problem.slug}`,
    lastModified: new Date(problem.updatedAt),
    changeFrequency: "monthly" as const,
    priority: 0.75,
  }));

  return [...pages, ...articles, ...problems];
}
