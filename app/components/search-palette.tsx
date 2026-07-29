"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { SearchEntry } from "../domain/content";
import { rankSearchEntries, searchTokens } from "../domain/search";
import { OverlayLayer, useOverlayEnvironment } from "./overlay-layer";

type SearchFilter = "全部" | SearchEntry["type"];
const RECENT_SEARCH_KEY = "knowledge-garden-recent-searches-v1";

function readRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored: unknown = JSON.parse(window.localStorage.getItem(RECENT_SEARCH_KEY) ?? "[]");
    return Array.isArray(stored)
      ? stored.filter((item): item is string => typeof item === "string").slice(0, 5)
      : [];
  } catch {
    window.localStorage.removeItem(RECENT_SEARCH_KEY);
    return [];
  }
}

function Highlighted({ value, query }: { value: string; query: string }) {
  const tokens = searchTokens(query);
  if (!tokens.length) return value;
  const parts = value.split(new RegExp(
    `(${tokens.map((token) => token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
    "gi",
  ));
  return parts.map((part, index) =>
    tokens.some((token) => part.toLocaleLowerCase("zh-CN") === token)
      ? <mark key={`${part}-${index}`}>{part}</mark>
      : part
  );
}

export function SearchPalette({
  onOpen,
}: {
  onOpen?: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [filter, setFilter] = useState<SearchFilter>("全部");
  const [recentSearches, setRecentSearches] = useState(readRecentSearches);
  const [index, setIndex] = useState<SearchEntry[]>([]);
  const [indexState, setIndexState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  useOverlayEnvironment({ active: open, bodyClass: "search-open", isolate: ".site-root" });

  const loadIndex = useCallback(async () => {
    if (indexState === "loading" || indexState === "ready") return;
    setIndexState("loading");
    try {
      const response = await fetch("/api/search", { headers: { Accept: "application/json" } });
      const payload = await response.json() as { entries?: SearchEntry[] };
      if (!response.ok || !Array.isArray(payload.entries)) throw new Error("search unavailable");
      setIndex(payload.entries);
      setIndexState("ready");
    } catch {
      setIndexState("error");
    }
  }, [indexState]);

  const availableTags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const entry of index) {
      for (const tag of entry.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0], "zh-CN"))
      .slice(0, 5)
      .map(([tag]) => tag);
  }, [index]);

  const rankedResults = useMemo(() => rankSearchEntries(index, query), [index, query]);

  const results = useMemo(() => {
    return rankedResults
      .filter((item) => filter === "全部" || item.type === filter)
      .slice(0, 8);
  }, [filter, rankedResults]);

  const typeCounts = useMemo(() => ({
    全部: rankedResults.length,
    文章: rankedResults.filter((item) => item.type === "文章").length,
    项目: rankedResults.filter((item) => item.type === "项目").length,
    题解: rankedResults.filter((item) => item.type === "题解").length,
  }), [rankedResults]);

  function close(restoreFocus = true) {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
    setFilter("全部");
    if (restoreFocus) window.requestAnimationFrame(() => triggerRef.current?.focus());
  }

  function visit(href: string) {
    const normalized = query.trim();
    if (normalized) {
      const next = [normalized, ...recentSearches.filter((item) => item !== normalized)].slice(0, 5);
      setRecentSearches(next);
      try {
        window.localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(next));
      } catch {
        // Search history is optional and remains device-local.
      }
    }
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  useEffect(() => {
    function shortcut(event: KeyboardEvent) {
      const target = event.target;
      const typing = target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLElement && target.isContentEditable);
      const anotherModalOpen = Boolean(document.querySelector('[aria-modal="true"]'));
      if (anotherModalOpen) return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onOpen?.();
        setOpen(true);
        void loadIndex();
      } else if (event.key === "/" && !typing) {
        event.preventDefault();
        onOpen?.();
        setOpen(true);
        void loadIndex();
      }
    }
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, [loadIndex, onOpen]);

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus());
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
      if (event.key === "Tab" && dialogRef.current) {
        const controls = [...dialogRef.current.querySelectorAll<HTMLElement>(
          'input, button:not(:disabled), a[href]',
        )];
        const first = controls[0];
        const last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function onInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => results.length
        ? Math.min(results.length - 1, current + 1)
        : 0);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => Math.max(0, current - 1));
    } else if (event.key === "Enter" && results[activeIndex]) {
      event.preventDefault();
      visit(results[activeIndex].href);
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        className="search-trigger"
        type="button"
        aria-label="打开全站搜索"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          onOpen?.();
          setOpen(true);
          void loadIndex();
        }}
      >
        <span aria-hidden="true">⌕</span>
        <b>搜索</b>
        <kbd>⌘ K</kbd>
      </button>
      {open && <OverlayLayer>
        <div className="search-palette-backdrop" role="presentation" onPointerDown={(event) => {
          if (event.target === event.currentTarget) close();
        }}>
          <div
            ref={dialogRef}
            className="search-palette"
            role="dialog"
            aria-modal="true"
            aria-labelledby="search-palette-title"
          >
            <header>
              <div>
                <p className="eyebrow">DISCOVER</p>
                <h2 id="search-palette-title">搜索整座知识花园</h2>
              </div>
              <button type="button" onClick={() => close()} aria-label="关闭搜索">×</button>
            </header>
            <label className="search-palette-input">
              <span className="sr-only">搜索文章、题解与项目</span>
              <span aria-hidden="true">⌕</span>
              <input
                ref={inputRef}
                type="search"
                value={query}
                spellCheck={false}
                autoComplete="off"
                role="combobox"
                aria-autocomplete="list"
                aria-expanded="true"
                aria-controls="search-palette-results"
                aria-describedby="search-palette-summary"
                aria-activedescendant={results[activeIndex] ? `search-result-${activeIndex}` : undefined}
                placeholder="输入文章、项目、标签或技术关键词…"
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={onInputKeyDown}
              />
              {query && <button type="button" onClick={() => setQuery("")} aria-label="清除搜索">清除</button>}
            </label>
            <div className="search-palette-discovery">
              <div className="search-palette-filters" role="group" aria-label="筛选搜索结果">
                {(["全部", "文章", "题解", "项目"] as const).map((type) => (
                  <button
                    type="button"
                    className={filter === type ? "active" : ""}
                    aria-pressed={filter === type}
                    key={type}
                    onClick={() => {
                      setFilter(type);
                      setActiveIndex(0);
                    }}
                  >
                    {type}<span>{typeCounts[type]}</span>
                  </button>
                ))}
              </div>
              {!query && (recentSearches.length > 0 || availableTags.length > 0) && (
                <div className="search-palette-suggestions" aria-label="搜索建议">
                  {(recentSearches.length ? recentSearches : availableTags).map((suggestion) => (
                    <button type="button" key={suggestion} onClick={() => {
                      setQuery(suggestion);
                      setActiveIndex(0);
                    }}>
                      {recentSearches.length ? "↺" : "#"} {suggestion}
                    </button>
                  ))}
                </div>
              )}
              <p
                id="search-palette-summary"
                className="search-palette-summary"
                role="status"
                aria-live="polite"
              >
                {indexState === "loading"
                  ? "正在准备搜索…"
                  : indexState === "error"
                    ? "搜索服务暂时不可用"
                    : query ? `找到 ${typeCounts[filter]} 条匹配内容` : "推荐从这些内容开始"}
              </p>
            </div>
            <ul
              id="search-palette-results"
              role="listbox"
              aria-busy={indexState === "loading"}
            >
              {results.map((item, resultIndex) => (
                <li
                  id={`search-result-${resultIndex}`}
                  role="option"
                  aria-selected={activeIndex === resultIndex}
                  key={`${item.type}-${item.href}`}
                >
                  <Link
                    href={item.href}
                    onMouseEnter={() => setActiveIndex(resultIndex)}
                    onFocus={() => setActiveIndex(resultIndex)}
                    onClick={(event) => {
                      event.preventDefault();
                      visit(item.href);
                    }}
                  >
                    <i aria-hidden="true">
                      {item.type === "文章" ? "▤" : item.type === "题解" ? "λ" : "◇"}
                    </i>
                    <span>
                      <strong><Highlighted value={item.title} query={query} /></strong>
                      <small>{item.type} · {item.detail}</small>
                      {query && <em><Highlighted value={item.excerpt} query={query} /></em>}
                    </span>
                    <b aria-hidden="true">→</b>
                  </Link>
                </li>
              ))}
            </ul>
            {indexState === "error" && (
              <div className="search-palette-empty">
                <strong>搜索暂时没有响应</strong>
                <p>你的页面没有问题，可以重试或改用探索页浏览。</p>
                <button type="button" onClick={() => {
                  void loadIndex();
                }}>重新加载</button>
              </div>
            )}
            {indexState === "ready" && !results.length && (
              <div className="search-palette-empty">
                <strong>没有找到对应节点</strong>
                <p>试试更短的关键词，或者前往探索页按主题浏览。</p>
                <Link href="/explore" onClick={() => setOpen(false)}>打开探索页 →</Link>
              </div>
            )}
            <footer>
              <span><kbd>↑</kbd><kbd>↓</kbd> 选择</span>
              <span><kbd>Enter</kbd> 打开</span>
              <span><kbd>Esc</kbd> 关闭</span>
              {query && (
                <Link href={`/explore?q=${encodeURIComponent(query.trim())}`} onClick={() => setOpen(false)}>
                  在探索页查看 →
                </Link>
              )}
            </footer>
          </div>
        </div>
      </OverlayLayer>}
    </>
  );
}
