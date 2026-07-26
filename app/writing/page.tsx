import type { Metadata } from "next";
import { contentServices } from "../composition/content";
import { SiteShell } from "../components/site-shell";
import { ArchiveBrowser } from "./archive-browser";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const profile = await contentServices.site.getProfile();
  return {
    title: profile.pages.writing.title,
    description: profile.pages.writing.description,
  };
}

export default async function WritingPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string; year?: string }>;
}) {
  const { category, q = "", year } = await searchParams;
  const [articles, taxonomy, profile] = await Promise.all([
    contentServices.articles.list(),
    contentServices.discovery.getTaxonomy(),
    contentServices.site.getProfile(),
  ]);
  const selectedCategory = taxonomy.categories.some((item) => item.value === category)
    ? category
    : "全部";
  const selectedYear = articles.some((article) => article.year === year) ? year : "";
  const intro = profile.pages.writing;
  return (
    <SiteShell active="writing">
      <main id="main-content" className="page-shell archive-page">
        <header className="page-intro writing-intro">
          <p className="eyebrow">{intro.eyebrow}</p>
          <h1>{intro.title}</h1>
          <p>{intro.description}</p>
          <small>{articles.length} 篇文章 · 按时间倒序</small>
        </header>

        <ArchiveBrowser
          key={`${selectedCategory}|${q}|${selectedYear}`}
          articles={articles}
          categories={taxonomy.categories.map((item) => item.value)}
          initialFilter={selectedCategory}
          initialQuery={q}
          initialYear={selectedYear}
        />
      </main>
    </SiteShell>
  );
}
