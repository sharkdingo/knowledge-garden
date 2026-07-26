"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import type { AlgorithmCodeBlock, AlgorithmHubConfig } from "../../domain/content";

export function AlgorithmCodeDeck({
  blocks,
  config,
}: {
  blocks: AlgorithmCodeBlock[];
  config: AlgorithmHubConfig;
}) {
  const deckId = useId();
  const panelId = `${deckId}-panel`;
  const [activeId, setActiveId] = useState(blocks[0]?.id ?? "");
  const [copyState, setCopyState] = useState<"idle" | "success" | "error">("idle");
  const resetTimer = useRef<number | null>(null);
  const active = blocks.find((block) => block.id === activeId) ?? blocks[0];

  useEffect(() => () => {
    if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
  }, []);

  if (!active) return null;

  function select(block: AlgorithmCodeBlock, focus = false) {
    setActiveId(block.id);
    setCopyState("idle");
    if (focus) {
      window.requestAnimationFrame(() => {
        document.getElementById(`${deckId}-${block.id}-tab`)?.focus();
      });
    }
  }

  function navigateTabs(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % blocks.length;
    if (event.key === "ArrowLeft") nextIndex = (index - 1 + blocks.length) % blocks.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = blocks.length - 1;
    if (nextIndex === null) return;
    event.preventDefault();
    select(blocks[nextIndex], true);
  }

  async function copy() {
    if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
    try {
      await navigator.clipboard.writeText(active.code);
      setCopyState("success");
      resetTimer.current = window.setTimeout(() => setCopyState("idle"), 1800);
    } catch {
      setCopyState("error");
      resetTimer.current = window.setTimeout(() => setCopyState("idle"), 2600);
    }
  }

  return (
    <section className="algorithm-code" aria-label={config.codeTitle}>
      <header>
        <div className="algorithm-code-tabs" role="tablist" aria-label={config.codeLanguageLabel}>
          {blocks.map((block, index) => (
            <button
              id={`${deckId}-${block.id}-tab`}
              type="button"
              role="tab"
              key={block.id}
              aria-selected={block.id === active.id}
              aria-controls={panelId}
              tabIndex={block.id === active.id ? 0 : -1}
              className={block.id === active.id ? "active" : ""}
              onClick={() => select(block)}
              onKeyDown={(event) => navigateTabs(event, index)}
            >
              {block.label || block.language}
            </button>
          ))}
        </div>
        <button type="button" className="algorithm-copy" onClick={copy}>
          {copyState === "success"
            ? config.copiedLabel
            : copyState === "error" ? config.copyErrorLabel : config.copyLabel}
        </button>
      </header>
      <div
        id={panelId}
        className="algorithm-code-scroll"
        role="tabpanel"
        aria-labelledby={`${deckId}-${active.id}-tab`}
        tabIndex={0}
        aria-label={config.codeRegionTemplate.replaceAll("{language}", active.language)}
      >
        <ol>
          {active.code.split("\n").map((line, index) => (
            <li key={`${index}-${line.slice(0, 12)}`}><code>{line || " "}</code></li>
          ))}
        </ol>
      </div>
    </section>
  );
}
