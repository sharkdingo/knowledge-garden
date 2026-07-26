"use client";

import { useEffect, useRef, useState } from "react";

type ReadingSize = "compact" | "comfortable" | "large";
type ReadingLeading = "balanced" | "relaxed";
type ReadingWidth = "narrow" | "standard" | "wide";
type ReadingPreferences = {
  size: ReadingSize;
  leading: ReadingLeading;
  width: ReadingWidth;
};

const PREFERENCE_KEY = "knowledge-garden-reading-preferences-v1";
const DEFAULT_PREFERENCES: ReadingPreferences = {
  size: "comfortable",
  leading: "balanced",
  width: "standard",
};

function applyPreferences(preferences: ReadingPreferences) {
  const root = document.documentElement;
  root.dataset.readingSize = preferences.size;
  root.dataset.readingLeading = preferences.leading;
  root.dataset.readingWidth = preferences.width;
}

function readPreferences(): ReadingPreferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  try {
    const stored = JSON.parse(window.localStorage.getItem(PREFERENCE_KEY) ?? "null") as Partial<ReadingPreferences> | null;
    return {
      size: stored?.size === "compact" || stored?.size === "large"
        ? stored.size
        : "comfortable",
      leading: stored?.leading === "relaxed" ? "relaxed" : "balanced",
      width: stored?.width === "narrow" || stored?.width === "wide"
        ? stored.width
        : "standard",
    };
  } catch {
    window.localStorage.removeItem(PREFERENCE_KEY);
    return DEFAULT_PREFERENCES;
  }
}

export function ReadingFocus() {
  const [focused, setFocused] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [preferences, setPreferences] = useState(readPreferences);
  const toolsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      document.body.classList.remove("reading-focus");
      delete document.documentElement.dataset.readingSize;
      delete document.documentElement.dataset.readingLeading;
      delete document.documentElement.dataset.readingWidth;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (settingsOpen) {
          setSettingsOpen(false);
          return;
        }
        document.body.classList.remove("reading-focus");
        setFocused(false);
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!toolsRef.current?.contains(event.target as Node)) setSettingsOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [settingsOpen]);

  useEffect(() => {
    applyPreferences(preferences);
  }, [preferences]);

  function updatePreferences(next: ReadingPreferences) {
    setPreferences(next);
    applyPreferences(next);
    try {
      window.localStorage.setItem(PREFERENCE_KEY, JSON.stringify(next));
    } catch {
      // Reading preferences are optional and remain device-local.
    }
  }

  function toggle() {
    setFocused((current) => {
      const next = !current;
      document.body.classList.toggle("reading-focus", next);
      return next;
    });
  }

  return (
    <div className="reading-tools" ref={toolsRef}>
      <button
        className="reading-focus-toggle"
        type="button"
        aria-pressed={focused}
        onClick={toggle}
      >
        <span aria-hidden="true">{focused ? "×" : "◐"}</span>
        {focused ? "退出专注" : "专注阅读"}
        {focused && <small>Esc</small>}
      </button>
      <button
        className="reading-settings-toggle"
        type="button"
        aria-expanded={settingsOpen}
        aria-controls="reading-preferences-panel"
        aria-label="调整阅读排版"
        onClick={() => setSettingsOpen((current) => !current)}
      >
        Aa
      </button>
      {settingsOpen && (
        <section
          id="reading-preferences-panel"
          className="reading-preferences"
          aria-label="阅读排版设置"
        >
          <header>
            <div><small>READING</small><strong>阅读排版</strong></div>
            <button type="button" aria-label="关闭阅读设置" onClick={() => setSettingsOpen(false)}>×</button>
          </header>
          <fieldset>
            <legend>字号</legend>
            <div>
              {([
                ["compact", "小"],
                ["comfortable", "标准"],
                ["large", "大"],
              ] as const).map(([value, label]) => (
                <button
                  type="button"
                  aria-pressed={preferences.size === value}
                  key={value}
                  onClick={() => updatePreferences({ ...preferences, size: value })}
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>行距</legend>
            <div>
              {([
                ["balanced", "均衡"],
                ["relaxed", "舒展"],
              ] as const).map(([value, label]) => (
                <button
                  type="button"
                  aria-pressed={preferences.leading === value}
                  key={value}
                  onClick={() => updatePreferences({ ...preferences, leading: value })}
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>版心</legend>
            <div>
              {([
                ["narrow", "窄"],
                ["standard", "标准"],
                ["wide", "宽"],
              ] as const).map(([value, label]) => (
                <button
                  type="button"
                  aria-pressed={preferences.width === value}
                  key={value}
                  onClick={() => updatePreferences({ ...preferences, width: value })}
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>
          <button type="button" className="reading-preferences-reset" onClick={() => updatePreferences(DEFAULT_PREFERENCES)}>
            恢复默认
          </button>
        </section>
      )}
    </div>
  );
}
