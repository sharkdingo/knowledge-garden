import type { Metadata } from "next";
import Link from "next/link";
import { contentServices } from "../composition/content";
import { SiteShell } from "../components/site-shell";
import { ExploreBrowser } from "./explore-browser";

export const metadata: Metadata = {
  title: "探索",
  description: "通过搜索、分类、标签与时间线探索文章和项目。",
};
export const dynamic = "force-dynamic";

export default async function ExplorePage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const [{ categories, tags }, searchIndex, articles, profile] = await Promise.all([
    contentServices.discovery.getTaxonomy(),
    contentServices.discovery.buildSearchIndex(),
    contentServices.articles.list(),
    contentServices.site.getProfile(),
  ]);
  const archives = Object.entries(
    articles.reduce<Record<string, number>>((result, article) => {
      result[article.year] = (result[article.year] ?? 0) + 1;
      return result;
    }, {}),
  ).sort(([left], [right]) => right.localeCompare(left));
  const intro = profile.pages.explore;
  return (
    <SiteShell active="explore">
      <main id="main-content" className="page-shell explore-page">
        <header className="page-intro compact-intro">
          <p className="eyebrow">{intro.eyebrow}</p>
          <h1>{intro.title}</h1>
          <p>{intro.description}</p>
        </header>
        <div className="explore-layout">
          <div className="explore-main">
            <ExploreBrowser index={searchIndex} initialQuery={q} />
            {categories.length > 0 && <section className="category-panel" aria-labelledby="category-title">
              <h2 id="category-title">主题分类 <span>CATEGORIES</span></h2>
              <div className="category-index">
                {categories.map((category) => (
                  <Link href={`/writing?category=${encodeURIComponent(category.value)}`} key={category.name}>
                    <span><strong>{category.name}</strong><small>{category.description}</small></span>
                    <b>{category.count}</b>
                  </Link>
                ))}
              </div>
            </section>}
            {tags.length > 0 && <section className="tag-panel" aria-labelledby="tags-title">
              <h2 id="tags-title">标签索引 <span>TAGS</span></h2>
              <div className="tag-index">{tags.map((tag) => <Link href={`/explore?q=${encodeURIComponent(tag)}`} key={tag}>#{tag}</Link>)}</div>
            </section>}
            {archives.length > 0 && <section className="archive-index" aria-labelledby="archive-title">
              <h2 id="archive-title">时间归档 <span>ARCHIVE</span></h2>
              <div>{archives.map(([year, count]) => <Link href={`/writing?year=${year}`} key={year}><strong>{year}</strong><small>{count} 篇</small></Link>)}</div>
            </section>}
          </div>
        </div>
      </main>
    </SiteShell>
  );
}
