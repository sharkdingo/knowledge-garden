"use client";

import { useEffect, useState } from "react";
import type { SiteProfile } from "../domain/content";

const konamiSequence = [
  "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
  "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a",
];

export function ExperienceLayer({
  easterEggs,
}: {
  easterEggs: SiteProfile["easterEggs"];
}) {
  const [notice, setNotice] = useState<{ title: string; message: string } | null>(null);
  const [signal, setSignal] = useState(false);

  useEffect(() => {
    console.info(easterEggs.console.greeting);
    let progress = 0;
    let brandClicks = 0;
    let brandTimer: ReturnType<typeof setTimeout> | undefined;
    let noticeTimer: number | undefined;
    let signalTimer: number | undefined;

    const reveal = (next: { title: string; message: string }, withSignal = false) => {
      clearTimeout(noticeTimer);
      clearTimeout(signalTimer);
      setNotice(next);
      setSignal(withSignal);
      noticeTimer = window.setTimeout(() => setNotice(null), 5200);
      if (withSignal) signalTimer = window.setTimeout(() => setSignal(false), 7600);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;
      const expected = konamiSequence[progress];
      if (event.key.toLowerCase() === expected.toLowerCase()) {
        progress += 1;
        if (progress === konamiSequence.length) {
          progress = 0;
          reveal(easterEggs.konami, true);
        }
      } else {
        progress = event.key.toLowerCase() === konamiSequence[0].toLowerCase() ? 1 : 0;
      }
    };

    const onClick = (event: MouseEvent) => {
      const element = event.target instanceof Element
        ? event.target.closest("[data-easter-brand]")
        : null;
      if (!element) return;
      brandClicks += 1;
      clearTimeout(brandTimer);
      clearTimeout(noticeTimer);
      clearTimeout(signalTimer);
      brandTimer = setTimeout(() => { brandClicks = 0; }, 1800);
      if (brandClicks >= easterEggs.brand.clicks) {
        event.preventDefault();
        brandClicks = 0;
        reveal(easterEggs.brand);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("click", onClick);
    return () => {
      clearTimeout(brandTimer);
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("click", onClick);
    };
  }, [easterEggs]);

  return (
    <>
      {signal && (
        <div className="signal-field" aria-hidden="true">
          {Array.from({ length: 24 }, (_, index) => (
            <i
              key={index}
              style={{
                "--x": `${(index * 37) % 101}%`,
                "--y": `${(index * 61) % 97}%`,
                "--delay": `${(index % 8) * 90}ms`,
              } as React.CSSProperties}
            />
          ))}
        </div>
      )}
      <div className={notice ? "easter-toast is-visible" : "easter-toast"} role="status" aria-live="polite">
        {notice && (
          <>
            <small>{notice.title}</small>
            <p>{notice.message}</p>
            <button type="button" onClick={() => setNotice(null)} aria-label="关闭提示">×</button>
          </>
        )}
      </div>
    </>
  );
}
