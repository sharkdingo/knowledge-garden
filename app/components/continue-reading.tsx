"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ArticleSummary } from "../domain/content";

export type ReadingRecord = {
  slug: string;
  progress: number;
  readAt: string;
};

export const READING_HISTORY_KEY = "knowledge-garden-reading-v1";

export function ContinueReading({
  articles,
  label,
}: {
  articles: ArticleSummary[];
  label: string;
}) {
  const [record, setRecord] = useState<ReadingRecord | null>(null);
  const article = record
    ? articles.find((candidate) => candidate.slug === record.slug)
    : null;

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const stored = JSON.parse(localStorage.getItem(READING_HISTORY_KEY) ?? "[]") as ReadingRecord[];
        const next = stored
          .filter((item) => item.progress > 3 && item.progress < 96)
          .sort((left, right) => right.readAt.localeCompare(left.readAt))[0] ?? null;
        setRecord(next);
      } catch {
        setRecord(null);
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  if (!record || !article) return null;
  return (
    <aside className="continue-reading" aria-label={label}>
      <div>
        <p className="eyebrow">CONTINUE / {record.progress}%</p>
        <strong>{label}</strong>
        <span>{article.title}</span>
      </div>
      <Link href={`/writing/${article.slug}`}>
        继续阅读 <span aria-hidden="true">→</span>
      </Link>
    </aside>
  );
}
