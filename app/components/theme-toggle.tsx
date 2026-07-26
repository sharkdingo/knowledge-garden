"use client";

import { useEffect, useState } from "react";

type Theme = "dark" | "light";

function readTheme(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

function updateThemeColor(theme: Theme) {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) return;
  meta.content = theme === "light"
    ? meta.dataset.light ?? meta.content
    : meta.dataset.dark ?? meta.content;
}

export function ThemeToggle() {
  const [theme, setThemeState] = useState<Theme | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setThemeState(readTheme()));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  function selectTheme(next: Theme) {
    document.documentElement.dataset.theme = next;
    updateThemeColor(next);
    try {
      localStorage.setItem("site-theme", next);
    } catch {
      // Theme selection still works when browser storage is unavailable.
    }
    setThemeState(next);
  }

  return (
    <div className="theme-switch" role="group" aria-label="外观主题">
      <button
        type="button"
        className={theme === "light" ? "is-active" : undefined}
        aria-pressed={theme === "light"}
        aria-label="使用浅色主题"
        title="浅色主题"
        onClick={() => selectTheme("light")}
      >
        <span className="theme-icon theme-icon-sun" aria-hidden="true" />
      </button>
      <button
        type="button"
        className={theme === "dark" ? "is-active" : undefined}
        aria-pressed={theme === "dark"}
        aria-label="使用深色主题"
        title="深色主题"
        onClick={() => selectTheme("dark")}
      >
        <span className="theme-icon theme-icon-moon" aria-hidden="true" />
      </button>
    </div>
  );
}
