"use client";

import { useEffect, useRef, useState } from "react";
import type { SiteProfile } from "../domain/content";
import { OverlayLayer, useOverlayEnvironment } from "./overlay-layer";

const SEEN_KEY = "knowledge-garden-intro-v1";

export function HomeExperience({
  intro,
  children,
}: {
  intro: SiteProfile["hero"]["intro"];
  children: React.ReactNode;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const skipRef = useRef<HTMLButtonElement>(null);
  const [active, setActive] = useState(false);
  const [line, setLine] = useState(0);
  useOverlayEnvironment({
    active,
    bodyClass: "entrance-open",
    isolate: ".site-root",
  });

  function rememberAndClose() {
    try {
      localStorage.setItem(SEEN_KEY, "seen");
    } catch {
      // The entrance remains optional when browser storage is unavailable.
    }
    setActive(false);
  }

  function replay() {
    setLine(0);
    setActive(true);
  }

  useEffect(() => {
    if (!intro.enabled || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let seen = false;
    try {
      seen = localStorage.getItem(SEEN_KEY) === "seen";
    } catch {
      seen = true;
    }
    if (!seen) {
      const frame = window.requestAnimationFrame(() => setActive(true));
      return () => window.cancelAnimationFrame(frame);
    }
  }, [intro.enabled]);

  useEffect(() => {
    if (!active) return;
    const focusFrame = window.requestAnimationFrame(() => skipRef.current?.focus());
    const lineInterval = window.setInterval(() => {
      setLine((current) => Math.min(intro.lines.length - 1, current + 1));
    }, Math.max(320, intro.duration / Math.max(intro.lines.length, 1)));
    const closeTimer = window.setTimeout(rememberAndClose, intro.duration);
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") rememberAndClose();
      if (event.key === "Tab") {
        event.preventDefault();
        skipRef.current?.focus();
      }
    };
    window.addEventListener("keydown", keydown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.clearInterval(lineInterval);
      window.clearTimeout(closeTimer);
      window.removeEventListener("keydown", keydown);
    };
  }, [active, intro.duration, intro.lines.length]);

  function move(event: React.PointerEvent<HTMLDivElement>) {
    if (
      event.pointerType === "touch" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
    event.currentTarget.style.setProperty("--home-x", x.toFixed(3));
    event.currentTarget.style.setProperty("--home-y", y.toFixed(3));
  }

  return (
    <div
      ref={rootRef}
      className="home-experience"
      onPointerMove={move}
      onPointerLeave={(event) => {
        event.currentTarget.style.setProperty("--home-x", "0");
        event.currentTarget.style.setProperty("--home-y", "0");
      }}
    >
      {children}
      <button className="home-replay" type="button" onClick={replay}>
        <span aria-hidden="true">↻</span> {intro.replayLabel}
      </button>
      {active && <OverlayLayer>
        <div
          className="entrance-sequence"
          role="dialog"
          aria-modal="true"
          aria-labelledby="entrance-label"
          aria-describedby="entrance-line"
        >
          <div className="entrance-orbit" aria-hidden="true">
            <i /><i /><i />
          </div>
          <div className="entrance-copy">
            <p id="entrance-label">{intro.label}</p>
            <strong id="entrance-line" key={line}>{intro.lines[line]}</strong>
            <span aria-hidden="true">
              {intro.lines.map((_, index) => <i className={index <= line ? "active" : ""} key={index} />)}
            </span>
          </div>
          <button ref={skipRef} type="button" onClick={rememberAndClose}>
            {intro.skipLabel} <span aria-hidden="true">Esc</span>
          </button>
        </div>
      </OverlayLayer>}
    </div>
  );
}
