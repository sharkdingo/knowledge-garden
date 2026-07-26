"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ArticleSummary, PlaygroundContent } from "../domain/content";

type Challenge = {
  articles: ArticleSummary[];
  tags: string[];
  edges: Set<string>;
};

type SavedProgress = {
  found: string[];
  misses: number;
  phase: "ready" | "playing" | "complete" | "over";
};

function hash(value: string): number {
  let result = 2166136261;
  for (const character of value) {
    result ^= character.charCodeAt(0);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

function rotate<T>(items: T[], by: number): T[] {
  if (!items.length) return [];
  const offset = by % items.length;
  return [...items.slice(offset), ...items.slice(0, offset)];
}

function edgeKey(slug: string, tag: string) {
  return `${slug}::${tag}`;
}

function buildChallenge(
  articles: ArticleSummary[],
  dateKey: string,
  config: PlaygroundContent["constellation"],
): Challenge {
  const eligible = articles.filter((article) => article.tags.length);
  const selectedArticles = rotate(eligible, hash(dateKey))
    .slice(0, Math.min(config.articleCount, eligible.length));
  const edges = new Set<string>();
  const selectedTags: string[] = [];
  for (const article of selectedArticles) {
    const tags = rotate(article.tags, hash(`${dateKey}:${article.slug}`))
      .slice(0, config.connectionsPerArticle);
    for (const tag of tags) {
      edges.add(edgeKey(article.slug, tag));
      selectedTags.push(tag);
    }
  }
  const allTags = rotate(
    [...new Set(eligible.flatMap((article) => article.tags))],
    hash(`${dateKey}:tags`),
  );
  const tags = [...new Set([...selectedTags, ...allTags])].slice(
    0,
    Math.max(6, Math.min(9, selectedTags.length + 2)),
  );
  return { articles: selectedArticles, tags, edges };
}

function readProgress(key: string): SavedProgress | null {
  try {
    const value = localStorage.getItem(key);
    if (!value) return null;
    const parsed = JSON.parse(value) as SavedProgress;
    return Array.isArray(parsed.found) ? parsed : null;
  } catch {
    return null;
  }
}

function saveProgress(key: string, progress: SavedProgress) {
  try {
    localStorage.setItem(key, JSON.stringify(progress));
  } catch {
    // Daily progress is device-local and optional.
  }
}

export function KnowledgeConstellation({
  config,
  articles,
  dateKey,
}: {
  config: PlaygroundContent["constellation"];
  articles: ArticleSummary[];
  dateKey: string;
}) {
  const challenge = useMemo(
    () => buildChallenge(articles, dateKey, config),
    [articles, config, dateKey],
  );
  const storageKey = `knowledge-constellation:${dateKey}`;
  const [phase, setPhase] = useState<SavedProgress["phase"]>("ready");
  const [selected, setSelected] = useState("");
  const [found, setFound] = useState<Set<string>>(() => new Set());
  const [misses, setMisses] = useState(0);
  const [message, setMessage] = useState(config.instructions);
  const firstArticleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const saved = readProgress(storageKey);
    if (!saved) return;
    const validFound = saved.found.filter((edge) => challenge.edges.has(edge));
    const frame = window.requestAnimationFrame(() => {
      setFound(new Set(validFound));
      setMisses(Math.min(saved.misses, config.noiseBudget));
      setPhase(
        validFound.length === challenge.edges.size
          ? "complete"
          : saved.phase === "over" ? "over" : saved.phase,
      );
    });
    return () => window.cancelAnimationFrame(frame);
  }, [challenge.edges, config.noiseBudget, storageKey]);

  if (!articles.length) {
    return (
      <section className="content-empty-state" aria-labelledby="constellation-empty-title">
        <span aria-hidden="true">✦</span>
        <p className="eyebrow">{config.eyebrow}</p>
        <h2 id="constellation-empty-title">{config.emptyTitle}</h2>
        <p>{config.emptyDescription}</p>
      </section>
    );
  }

  function persist(
    nextFound: Set<string>,
    nextMisses: number,
    nextPhase: SavedProgress["phase"],
  ) {
    saveProgress(storageKey, {
      found: [...nextFound],
      misses: nextMisses,
      phase: nextPhase,
    });
  }

  function start() {
    const nextPhase = found.size === challenge.edges.size ? "complete" : "playing";
    setPhase(nextPhase);
    setSelected("");
    setMessage(nextPhase === "complete" ? config.completeMessage : config.instructions);
    window.requestAnimationFrame(() => firstArticleRef.current?.focus());
  }

  function restart() {
    const empty = new Set<string>();
    setFound(empty);
    setMisses(0);
    setSelected("");
    setPhase("playing");
    setMessage(config.instructions);
    persist(empty, 0, "playing");
    window.requestAnimationFrame(() => firstArticleRef.current?.focus());
  }

  function selectArticle(slug: string, title: string) {
    if (phase !== "playing") return;
    setSelected(slug);
    setMessage(`已选择《${title}》。现在选择一个与它真正相关的概念。`);
  }

  function connect(tag: string) {
    if (phase !== "playing") return;
    if (!selected) {
      setMessage("请先选择左侧的一篇文章，再选择概念。");
      return;
    }
    const edge = edgeKey(selected, tag);
    const article = challenge.articles.find((item) => item.slug === selected);
    if (challenge.edges.has(edge)) {
      if (found.has(edge)) {
        setMessage(`“${tag}”与《${article?.title ?? ""}》已经连接。`);
        return;
      }
      const next = new Set(found).add(edge);
      const complete = next.size === challenge.edges.size;
      setFound(next);
      setSelected("");
      setPhase(complete ? "complete" : "playing");
      setMessage(
        complete
          ? config.completeMessage
          : `连接成立：${tag} ↔ 《${article?.title ?? ""}》。继续寻找剩余关系。`,
      );
      persist(next, misses, complete ? "complete" : "playing");
      return;
    }
    const nextMisses = misses + 1;
    const over = nextMisses >= config.noiseBudget;
    setMisses(nextMisses);
    setMessage(
      over
        ? "噪声已经覆盖信号。本轮结束，可以重新校准星图。"
        : `这条关系不存在。还可以承受 ${config.noiseBudget - nextMisses} 次噪声。`,
    );
    setPhase(over ? "over" : "playing");
    persist(found, nextMisses, over ? "over" : "playing");
  }

  const connectedByArticle = (slug: string) =>
    [...found]
      .filter((edge) => edge.startsWith(`${slug}::`))
      .map((edge) => edge.split("::")[1]);

  return (
    <section className="constellation-game" aria-labelledby="constellation-title">
      <header className="constellation-heading">
        <div>
          <p className="eyebrow">{config.eyebrow}</p>
          <h2 id="constellation-title">{config.title}</h2>
          <p>{config.description}</p>
        </div>
        <dl aria-label="今日星图进度">
          <div><dt>连接</dt><dd>{found.size}/{challenge.edges.size}</dd></div>
          <div><dt>噪声</dt><dd>{misses}/{config.noiseBudget}</dd></div>
          <div><dt>周期</dt><dd>{dateKey.slice(5)}</dd></div>
        </dl>
      </header>

      {phase === "ready" ? (
        <div className="constellation-gate">
          <div className="constellation-symbol" aria-hidden="true">
            <i /><i /><i /><i /><span>✦</span>
          </div>
          <div>
            <h3>今天的知识关系已经生成</h3>
            <p>{config.instructions} 题目直接来自站内真实文章与标签，每天会重新排列。</p>
            <button className="button button-primary" type="button" onClick={start}>
              {config.startLabel} <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          <div
            className={`constellation-board phase-${phase}`}
            aria-describedby="constellation-instructions"
          >
            <div className="constellation-column article-nodes" aria-label="文章节点">
              <p>文章节点</p>
              {challenge.articles.map((article, index) => {
                const connections = connectedByArticle(article.slug);
                return (
                  <button
                    ref={index === 0 ? firstArticleRef : undefined}
                    key={article.slug}
                    type="button"
                    className={selected === article.slug ? "selected" : ""}
                    aria-pressed={selected === article.slug}
                    disabled={phase !== "playing"}
                    onClick={() => selectArticle(article.slug, article.title)}
                  >
                    <span>0{index + 1}</span>
                    <strong>{article.title}</strong>
                    <small>
                      {connections.length
                        ? connections.map((tag) => `#${tag}`).join(" ")
                        : "等待连接"}
                    </small>
                  </button>
                );
              })}
            </div>

            <div className="constellation-core" aria-hidden="true">
              <span style={{ "--progress": `${Math.round((found.size / Math.max(challenge.edges.size, 1)) * 100)}%` } as React.CSSProperties}>
                <i>✦</i>
              </span>
              <small>{Math.round((found.size / Math.max(challenge.edges.size, 1)) * 100)}%</small>
            </div>

            <div className="constellation-column concept-nodes" aria-label="概念节点">
              <p>概念节点</p>
              {challenge.tags.map((tag, index) => {
                const connectionCount = [...found].filter((edge) => edge.endsWith(`::${tag}`)).length;
                return (
                  <button
                    key={tag}
                    type="button"
                    disabled={phase !== "playing"}
                    onClick={() => connect(tag)}
                    className={connectionCount ? "connected" : ""}
                  >
                    <span>{["◇", "△", "□", "◎", "⌁", "✦", "∴", "∞", "⌘"][index % 9]}</span>
                    <strong>{tag}</strong>
                    <small>{connectionCount ? `${connectionCount} 条连接` : "未解析"}</small>
                  </button>
                );
              })}
            </div>
          </div>

          <p id="constellation-instructions" className="constellation-message" role="status" aria-live="polite">
            {message}
          </p>

          {(phase === "complete" || phase === "over") && (
            <div className={`constellation-result result-${phase}`} role="region" aria-labelledby="constellation-result-title">
              <div>
                <p className="eyebrow">{phase === "complete" ? "MAP COMPLETE" : "SIGNAL LOST"}</p>
                <h3 id="constellation-result-title">{phase === "complete" ? config.completeTitle : "星图被噪声覆盖"}</h3>
                <p>{phase === "complete" ? config.secret : "已发现的关系会保留；重新校准将从头开始，给你一次干净的推理机会。"}</p>
              </div>
              {phase === "complete" ? (
                <div className="constellation-reading">
                  {challenge.articles.map((article) => (
                    <Link href={`/writing/${article.slug}`} key={article.slug}>
                      阅读《{article.title}》 <span aria-hidden="true">↗</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <button className="button button-primary" type="button" onClick={restart}>
                  重新校准
                </button>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
