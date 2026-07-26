"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ArticleCategory, ArticleSummary } from "../domain/content";
import { searchTokens } from "../domain/search";
import { ContentEmptyState } from "../components/content-empty-state";

type ArticleFilter = "全部" | ArticleCategory;

export function ArchiveBrowser({
  articles,
  categories,
  initialFilter = "全部",
  initialQuery = "",
  initialYear = "",
}: {
  articles: ArticleSummary[];
  categories: ArticleCategory[];
  initialFilter?: ArticleFilter;
  initialQuery?: string;
  initialYear?: string;
}) {
  const filters: ArticleFilter[] = ["全部", ...categories];
  const [filter, setFilter] = useState<ArticleFilter>(initialFilter);
  const [query, setQuery] = useState(initialQuery);
  const [year, setYear] = useState(initialYear);

  function replaceLocation(nextFilter: ArticleFilter, nextQuery: string, nextYear: string) {
    const url = new URL(window.location.href);
    if (nextFilter === "全部") url.searchParams.delete("category");
    else url.searchParams.set("category", nextFilter);
    if (nextQuery.trim()) url.searchParams.set("q", nextQuery.trim());
    else url.searchParams.delete("q");
    if (nextYear) url.searchParams.set("year", nextYear);
    else url.searchParams.delete("year");
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}`);
  }

  const visible = useMemo(() => {
    const tokens = searchTokens(query);
    return articles.filter((article) => {
      const matchesFilter = filter === "全部" || article.category === filter;
      const matchesYear = !year || article.year === year;
      const haystack = `${article.title} ${article.summary} ${article.tags.join(" ")}`
        .normalize("NFKC")
        .toLocaleLowerCase("zh-CN");
      return matchesFilter && matchesYear && tokens.every((token) => haystack.includes(token));
    });
  }, [articles, filter, query, year]);

  if (!articles.length) {
    return (
      <ContentEmptyState
        eyebrow="WRITING / READY"
        title="还没有发布文章"
        description="文章区只展示从内容工作室正式发布的真实内容，不会自动生成占位文章。"
      />
    );
  }

  return (
    <>
      <div className="archive-controls">
        <label className="archive-search">
          <span className="sr-only">搜索文章</span>
          <i aria-hidden="true">⌕</i>
          <input
            type="search"
            enterKeyHint="search"
            spellCheck={false}
            aria-controls="archive-results"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              replaceLocation(filter, event.target.value, year);
            }}
            placeholder="搜索文章…"
          />
          {query && <button type="button" onClick={() => {
            setQuery("");
            replaceLocation(filter, "", year);
          }} aria-label="清除搜索">×</button>}
        </label>
        <div className="segmented-control" role="group" aria-label="按文章主题筛选">
          {filters.map((item) => (
            <button
              key={item}
              type="button"
              className={filter === item ? "active" : undefined}
              aria-pressed={filter === item}
              onClick={() => {
                setFilter(item);
                replaceLocation(item, query, year);
              }}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <p className="result-summary" role="status">
        当前显示 {visible.length} / {articles.length} 篇文章
        {filter !== "全部" ? ` · ${filter}` : ""}
        {year ? ` · ${year} 年` : ""}
        {year && (
          <button type="button" onClick={() => {
            setYear("");
            replaceLocation(filter, query, "");
          }}>清除年份</button>
        )}
      </p>

      <div id="archive-results" className="archive-list">
        {[...new Set(visible.map((article) => article.year))].map((year) => {
          const yearArticles = visible.filter((article) => article.year === year);
          if (!yearArticles.length) return null;
          return (
            <section key={year} className="archive-year" aria-labelledby={`year-${year}`}>
              <h2 id={`year-${year}`}>{year}</h2>
              <div>
                {yearArticles.map((article) => (
                  <article className="archive-row" key={article.slug}>
                    <time dateTime={article.date}>{article.date.slice(5)}</time>
                    <h3><Link href={`/writing/${article.slug}`}>{article.title}</Link></h3>
                    <span className="category">{article.category}</span>
                    <span>{article.minutes} 分钟阅读</span>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
        {!visible.length && (
          <div className="empty-state">
            <strong>没有找到匹配的文章。</strong>
            <button type="button" onClick={() => {
              setFilter("全部");
              setQuery("");
              setYear("");
              replaceLocation("全部", "", "");
            }}>清除筛选</button>
          </div>
        )}
      </div>
    </>
  );
}
