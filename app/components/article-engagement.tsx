"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  ArticleEngagementConfig,
  ArticleEngagementSnapshot,
} from "../domain/content";

const DEVICE_KEY = "knowledge-garden-anonymous-reader-v1";

function anonymousKey(): string {
  const created = crypto.randomUUID();
  try {
    const existing = window.localStorage.getItem(DEVICE_KEY);
    if (existing) return existing;
    window.localStorage.setItem(DEVICE_KEY, created);
  } catch {
    return created;
  }
  return created;
}

function interpolate(template: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

export function ArticleEngagement({
  slug,
  config,
}: {
  slug: string;
  config: ArticleEngagementConfig;
}) {
  const visitorKey = useRef("");
  const [snapshot, setSnapshot] = useState<ArticleEngagementSnapshot | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState(config.loadingLabel);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [loadFailed, setLoadFailed] = useState(false);
  const selected = useMemo(
    () => config.options.find((option) => option.id === snapshot?.selectedId) ?? null,
    [config.options, snapshot?.selectedId],
  );

  useEffect(() => {
    const key = anonymousKey();
    visitorKey.current = key;
    let current = true;
    void fetch(`/api/articles/${encodeURIComponent(slug)}/reaction?visitorKey=${encodeURIComponent(key)}`, {
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        return response.json() as Promise<ArticleEngagementSnapshot>;
      })
      .then((next) => {
        if (!current) return;
        setSnapshot(next);
        setLoadFailed(false);
        setMessage("");
      })
      .catch(() => {
        if (!current) return;
        setLoadFailed(true);
        setMessage(config.errorMessage);
      });
    return () => {
      current = false;
    };
  }, [config.errorMessage, loadAttempt, slug]);

  function retry() {
    setLoadFailed(false);
    setMessage(config.loadingLabel);
    setLoadAttempt((attempt) => attempt + 1);
  }

  async function choose(reactionId: string) {
    if (!visitorKey.current || busyId) return;
    const remove = snapshot?.selectedId === reactionId;
    setBusyId(reactionId);
    setMessage("");
    try {
      const response = await fetch(`/api/articles/${encodeURIComponent(slug)}/reaction`, {
        method: remove ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitorKey: visitorKey.current,
          ...(!remove && { reactionId }),
        }),
      });
      if (!response.ok) throw new Error();
      const next = await response.json() as ArticleEngagementSnapshot;
      setSnapshot(next);
      const option = config.options.find((item) => item.id === next.selectedId);
      setMessage(option
        ? `${interpolate(config.thanksTemplate, { reaction: option.label })} ${option.reply}`
        : config.removedMessage);
    } catch {
      setMessage(config.errorMessage);
    } finally {
      setBusyId(null);
    }
  }

  if (!config.enabled) return null;

  return (
    <section className="article-engagement" aria-labelledby="reader-signal-title">
      <header>
        <p className="eyebrow">{config.eyebrow}</p>
        <h2 id="reader-signal-title">{config.title}</h2>
        <p>{config.description}</p>
      </header>
      <div className="article-engagement-options" role="group" aria-label={config.title}>
        {config.options.map((option) => {
          const count = snapshot?.counts.find((item) => item.id === option.id)?.count;
          const active = selected?.id === option.id;
          return (
            <button
              type="button"
              key={option.id}
              className={active ? "is-selected" : ""}
              aria-pressed={active}
              disabled={!snapshot || busyId !== null}
              onClick={() => choose(option.id)}
            >
              <span aria-hidden="true">{option.symbol}</span>
              <strong>{option.label}</strong>
              <small>{count ?? "—"}</small>
            </button>
          );
        })}
      </div>
      <div className="article-engagement-meta">
        <p aria-live="polite">
          {message || (snapshot
            ? interpolate(config.totalTemplate, { count: snapshot.total })
            : config.loadingLabel)}
        </p>
        <div>
          <small>{config.privacyNote}</small>
          {loadFailed ? (
            <button type="button" onClick={retry}>
              {config.retryLabel}
            </button>
          ) : selected && (
            <button
              type="button"
              disabled={busyId !== null}
              onClick={() => choose(selected.id)}
            >
              {config.removeLabel}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
