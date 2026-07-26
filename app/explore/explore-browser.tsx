"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { SearchEntry } from "../domain/content";
import { ContentEmptyState } from "../components/content-empty-state";

export function ExploreBrowser({ index, initialQuery = "" }: { index: SearchEntry[]; initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);

  const updateQuery = useCallback((next: string) => {
    setQuery(next);
    const url = new URL(window.location.href);
    if (next.trim()) url.searchParams.set("q", next.trim());
    else url.searchParams.delete("q");
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}`);
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        document.getElementById("explore-query")?.focus();
      }
      const target = document.activeElement;
      const isTyping = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target?.getAttribute("contenteditable") === "true";
      if (event.key === "/" && !isTyping) {
        event.preventDefault();
        document.getElementById("explore-query")?.focus();
      }
      if (event.key === "Escape" && target?.id === "explore-query") {
        if (query) updateQuery("");
        else (target as HTMLInputElement).blur();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [query, updateQuery]);

  const results = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("zh-CN");
    if (!normalized) return index.slice(0, 2);
    return index.filter((item) => `${item.title} ${item.keywords}`.toLocaleLowerCase("zh-CN").includes(normalized)).slice(0, 6);
  }, [index, query]);

  if (!index.length) {
    return (
      <ContentEmptyState
        eyebrow="DISCOVERY / READY"
        title="探索索引还是空的"
        description="发布文章、题解或项目后，它们会自动进入统一搜索与主题索引。"
      />
    );
  }

  return (
    <>
      <label className="explore-search">
        <span className="sr-only">搜索文章、项目与标签</span>
        <i aria-hidden="true">⌕</i>
        <input
          id="explore-query"
          type="search"
          enterKeyHint="search"
          spellCheck={false}
          aria-controls="explore-results"
          aria-describedby="explore-search-hint"
          aria-keyshortcuts="Control+K Meta+K /"
          value={query}
          onChange={(event) => updateQuery(event.target.value)}
          placeholder="搜索文章、项目与标签…"
        />
        {query && <button type="button" onClick={() => updateQuery("")} aria-label="清除搜索">×</button>}
        <kbd>Ctrl/⌘ K</kbd>
        <small id="explore-search-hint">按 / 聚焦</small>
      </label>
      <aside id="explore-results" className="recent-panel" aria-label={query ? "搜索结果" : "推荐起点"}>
        <h2>{query ? "搜索结果" : "推荐起点"} / {query ? "RESULTS" : "START HERE"}</h2>
        <p className="result-summary" role="status">{query ? `找到 ${results.length} 条结果` : "从精选内容开始探索"}</p>
        <div>
          {results.map((item) => (
            <Link href={item.href} key={`${item.type}-${item.title}`}>
              <i aria-hidden="true">{item.type === "文章" ? "▤" : "◇"}</i>
              <span><strong>{item.title}</strong><small>{item.type} · {item.detail}</small></span>
              <b aria-hidden="true">→</b>
            </Link>
          ))}
          {!results.length && <p className="no-results">没有匹配结果，试试更短的关键词。</p>}
        </div>
      </aside>
    </>
  );
}
