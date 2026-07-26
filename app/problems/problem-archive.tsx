"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { AlgorithmHubConfig, AlgorithmProblemSummary } from "../domain/content";

function interpolate(template: string, count: number): string {
  return template.replaceAll("{count}", String(count));
}

export function ProblemArchive({
  problems,
  config,
}: {
  problems: AlgorithmProblemSummary[];
  config: AlgorithmHubConfig;
}) {
  const [query, setQuery] = useState("");
  const [platform, setPlatform] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const platforms = useMemo(
    () => [...new Set(problems.map((problem) => problem.platform))].sort((a, b) =>
      a.localeCompare(b, "zh-CN")
    ),
    [problems],
  );
  const filtered = useMemo(() => {
    const needle = query.normalize("NFKC").toLocaleLowerCase("zh-CN").trim();
    return problems.filter((problem) => {
      if (platform !== "all" && problem.platform !== platform) return false;
      if (difficulty !== "all" && problem.difficulty !== difficulty) return false;
      if (!needle) return true;
      const searchable = [
        problem.platform,
        problem.problemId,
        problem.title,
        problem.summary,
        problem.tags.join(" "),
        problem.languages.join(" "),
      ].join(" ").normalize("NFKC").toLocaleLowerCase("zh-CN");
      return needle.split(/\s+/).every((token) => searchable.includes(token));
    });
  }, [difficulty, platform, problems, query]);

  if (!problems.length) {
    return (
      <section className="algorithm-empty">
        <span aria-hidden="true">∅</span>
        <h2>{config.emptyTitle}</h2>
        <p>{config.emptyDescription}</p>
      </section>
    );
  }

  return (
    <section className="problem-archive" aria-labelledby="problem-archive-title">
      <h2 id="problem-archive-title" className="sr-only">{config.archiveTitle}</h2>
      <div className="problem-toolbar">
        <label>
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            value={query}
            placeholder={config.searchPlaceholder}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <select
          value={difficulty}
          aria-label={config.difficultyFilterLabel}
          onChange={(event) => setDifficulty(event.target.value)}
        >
          <option value="all">{config.allDifficultiesLabel}</option>
          <option value="easy">{config.difficultyLabels.easy}</option>
          <option value="medium">{config.difficultyLabels.medium}</option>
          <option value="hard">{config.difficultyLabels.hard}</option>
        </select>
      </div>
      <div className="problem-platforms" role="group" aria-label={config.platformFilterLabel}>
        <button
          type="button"
          className={platform === "all" ? "active" : ""}
          aria-pressed={platform === "all"}
          onClick={() => setPlatform("all")}
        >
          {config.allPlatformsLabel} <span>{problems.length}</span>
        </button>
        {platforms.map((item) => (
          <button
            type="button"
            key={item}
            className={platform === item ? "active" : ""}
            aria-pressed={platform === item}
            onClick={() => setPlatform(item)}
          >
            {item} <span>{problems.filter((problem) => problem.platform === item).length}</span>
          </button>
        ))}
      </div>
      <p className="problem-result-count" role="status">
        {interpolate(config.resultTemplate, filtered.length)}
      </p>
      <div className="problem-list">
        {filtered.map((problem, index) => (
          <Link href={`/problems/${problem.slug}`} key={problem.slug}>
            <span className="problem-list-index">{String(index + 1).padStart(2, "0")}</span>
            <span className="problem-list-main">
              <small>{problem.platform} / {problem.problemId}</small>
              <strong>{problem.title}</strong>
              <em>{problem.summary}</em>
              <span className="problem-list-tags">
                {problem.tags.slice(0, 4).map((tag) => <i key={tag}>#{tag}</i>)}
              </span>
            </span>
            <span className="problem-list-meta">
              <i className={`difficulty difficulty-${problem.difficulty}`}>
                {config.difficultyLabels[problem.difficulty]}
              </i>
              <small>{interpolate(config.solutionCountTemplate, problem.solutionCount)}</small>
              <small>{problem.languages.join(" · ")}</small>
              <b aria-hidden="true">→</b>
            </span>
          </Link>
        ))}
      </div>
      {!filtered.length && (
        <div className="problem-filter-empty">
          <strong>{config.noResultsTitle}</strong>
          <button type="button" onClick={() => {
            setQuery("");
            setPlatform("all");
            setDifficulty("all");
          }}>{config.clearFiltersLabel}</button>
        </div>
      )}
    </section>
  );
}
