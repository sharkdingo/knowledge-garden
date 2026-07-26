"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type {
  DailyExperience,
  DailyExperienceConfig,
  DailyResponseMode,
} from "../domain/content";

const VISITOR_KEY = "knowledge-garden:visitor";

function recommendation(
  mode: DailyResponseMode,
  experience: DailyExperience,
) {
  if (mode.target === "project" && experience.project) {
    return {
      href: `/projects#project-${experience.project.id}`,
      detail: experience.project.name,
    };
  }
  if (mode.target === "play") {
    return { href: "/play", detail: experience.tag };
  }
  return {
    href: `/writing/${experience.article.slug}`,
    detail: experience.article.title,
  };
}

export function DailySignal({
  experience,
  config,
}: {
  experience: DailyExperience;
  config: DailyExperienceConfig;
}) {
  const [modeId, setModeId] = useState("");
  const [visits, setVisits] = useState<number | null>(null);
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const stored = JSON.parse(localStorage.getItem(VISITOR_KEY) ?? "{}") as {
          count?: number;
          lastDate?: string;
          modes?: Record<string, string>;
        };
        const count = stored.lastDate === experience.dateKey
          ? Math.max(stored.count ?? 1, 1)
          : Math.max(stored.count ?? 0, 0) + 1;
        setVisits(count);
        setModeId(stored.modes?.[experience.dateKey] ?? "");
        localStorage.setItem(VISITOR_KEY, JSON.stringify({
          count,
          lastDate: experience.dateKey,
          modes: {
            ...stored.modes,
            ...(stored.modes?.[experience.dateKey]
              ? { [experience.dateKey]: stored.modes[experience.dateKey] }
              : {}),
          },
        }));
      } catch {
        setVisits(1);
      }

      const hour = new Date().getHours();
      setGreeting(
        hour < 12
          ? config.greetings.morning
          : hour < 18 ? config.greetings.afternoon : config.greetings.evening,
      );
    }, 0);
    return () => window.clearTimeout(timer);
  }, [config.greetings, experience.dateKey]);

  function choose(id: string) {
    setModeId(id);
    try {
      const stored = JSON.parse(localStorage.getItem(VISITOR_KEY) ?? "{}") as {
        count?: number;
        lastDate?: string;
        modes?: Record<string, string>;
      };
      localStorage.setItem(VISITOR_KEY, JSON.stringify({
        ...stored,
        modes: { ...stored.modes, [experience.dateKey]: id },
      }));
    } catch {
      // The response remains functional when device-local storage is unavailable.
    }
  }

  const selected = config.modes.find((mode) => mode.id === modeId);
  const selectedRecommendation = selected
    ? recommendation(selected, experience)
    : null;
  const visitLabel = visits === null
    ? ""
    : config.visitTemplate.replaceAll("{count}", String(visits));

  return (
    <section
      className="daily-signal"
      aria-labelledby="daily-signal-title"
      style={{ "--daily-phase": `${experience.dayOfYear % 12}` } as React.CSSProperties}
    >
      <div className="daily-signal-mark" aria-hidden="true">
        <span>{String(experience.dayOfYear).padStart(3, "0")}</span>
        <i />
      </div>
      <div className="daily-signal-story">
        <header>
          <div>
            <p className="eyebrow">{config.eyebrow}</p>
            <time dateTime={experience.dateKey}>{experience.displayDate}</time>
          </div>
          <span>#{experience.tag}</span>
        </header>
        <h2 id="daily-signal-title">{experience.title}</h2>
        <p>{config.description}</p>
        <div className="daily-picks">
          <Link href={`/writing/${experience.article.slug}`}>
            <small>{config.articleLabel}</small>
            <strong>{experience.article.title}</strong>
            <span>{experience.article.minutes} 分钟 <b aria-hidden="true">→</b></span>
          </Link>
          {experience.project && (
            <Link href={`/projects#project-${experience.project.id}`}>
              <small>{config.projectLabel}</small>
              <strong>{experience.project.name}</strong>
              <span>{experience.project.statusLabel} <b aria-hidden="true">→</b></span>
            </Link>
          )}
        </div>
      </div>
      <aside className="daily-response" aria-label="今日访客回应">
        <div className="daily-response-meta">
          <p>{greeting || "\u00A0"}</p>
          <small>{visitLabel || "\u00A0"}</small>
        </div>
        <h3>{config.prompt}</h3>
        {!selected ? (
          <div className="daily-modes">
            {config.modes.map((mode) => (
              <button type="button" key={mode.id} onClick={() => choose(mode.id)}>
                <span aria-hidden="true">○</span>{mode.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="daily-answer" aria-live="polite">
            <p>{selected.reply}</p>
            {selectedRecommendation && (
              <Link href={selectedRecommendation.href}>
                <span>{selected.actionLabel}</span>
                <small>{selectedRecommendation.detail}</small>
                <b aria-hidden="true">→</b>
              </Link>
            )}
            <button type="button" onClick={() => choose("")}>{config.resetLabel}</button>
          </div>
        )}
      </aside>
    </section>
  );
}
