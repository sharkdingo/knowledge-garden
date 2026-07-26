"use client";

import { useEffect, useState } from "react";
import {
  READING_HISTORY_KEY,
  type ReadingRecord,
} from "./continue-reading";

function readResumeProgress(slug: string): number | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = JSON.parse(localStorage.getItem(READING_HISTORY_KEY) ?? "[]") as ReadingRecord[];
    const previous = stored.find((record) => record.slug === slug);
    return previous && previous.progress >= 5 && previous.progress < 96
      ? previous.progress
      : null;
  } catch {
    return null;
  }
}

export function ReadingProgress({ slug }: { slug: string }) {
  const [progress, setProgress] = useState(0);
  const [resumeProgress, setResumeProgress] = useState<number | null>(null);

  useEffect(() => {
    let frame = 0;
    const resumeFrame = window.requestAnimationFrame(() => {
      setResumeProgress(readResumeProgress(slug));
    });

    function update() {
      frame = 0;
      const article = document.getElementById("article-document");
      if (!article) return;
      const start = article.offsetTop;
      const distance = Math.max(article.offsetHeight - window.innerHeight, 1);
      const next = Math.min(100, Math.max(0, ((window.scrollY - start) / distance) * 100));
      const rounded = Math.round(next);
      setProgress(rounded);
      try {
        const stored = JSON.parse(localStorage.getItem(READING_HISTORY_KEY) ?? "[]") as ReadingRecord[];
        const previous = stored.find((record) => record.slug === slug);
        const record = {
          slug,
          progress: Math.max(previous?.progress ?? 0, rounded),
          readAt: new Date().toISOString(),
        };
        const nextHistory = [record, ...stored.filter((item) => item.slug !== slug)].slice(0, 12);
        localStorage.setItem(READING_HISTORY_KEY, JSON.stringify(nextHistory));
      } catch {
        // Reading continuity is optional and remains device-local.
      }
    }

    function requestUpdate() {
      if (!frame) frame = window.requestAnimationFrame(update);
    }

    update();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      if (frame) window.cancelAnimationFrame(frame);
      window.cancelAnimationFrame(resumeFrame);
    };
  }, [slug]);

  function resumeReading() {
    const article = document.getElementById("article-document");
    if (!article || resumeProgress == null) return;
    const distance = Math.max(article.offsetHeight - window.innerHeight, 1);
    const top = article.offsetTop + distance * (resumeProgress / 100);
    setResumeProgress(null);
    window.scrollTo({
      top,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  }

  return (
    <>
      <aside
        className="reading-progress"
        aria-label={`阅读进度 ${progress}%`}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        style={{ "--reading-progress": `${progress}%` } as React.CSSProperties}
      >
        <span>{progress}%</span><i><b /></i>
      </aside>
      {resumeProgress != null && (
        <aside className="reading-resume" aria-label="继续上次阅读">
          <span><small>CONTINUE</small><strong>上次读到 {resumeProgress}%</strong></span>
          <button type="button" onClick={resumeReading}>继续</button>
          <button type="button" aria-label="忽略上次阅读位置" onClick={() => setResumeProgress(null)}>×</button>
        </aside>
      )}
    </>
  );
}
