"use client";

import { useEffect, useState } from "react";

export function ArticleToc({
  sections,
  compact = false,
}: {
  sections: { id: string; title: string }[];
  compact?: boolean;
}) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    function updateActiveSection() {
      const current = sections
        .map((section) => document.getElementById(section.id))
        .filter((element): element is HTMLElement => Boolean(element))
        .filter((element) => element.getBoundingClientRect().top <= 150)
        .at(-1);
      setActiveId(current?.id ?? sections[0]?.id ?? "");
    }

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    return () => window.removeEventListener("scroll", updateActiveSection);
  }, [sections]);

  const links = (
    <>
      {sections.map((section) => (
        <a
          className={activeId === section.id ? "active" : undefined}
          aria-current={activeId === section.id ? "location" : undefined}
          href={`#${section.id}`}
          key={section.id}
        >
          {section.title}
        </a>
      ))}
    </>
  );

  if (compact) {
    return (
      <details className="mobile-toc">
        <summary>
          <span>文章目录</span>
          <small>{sections.length} 个章节</small>
        </summary>
        <nav aria-label="文章目录">{links}</nav>
      </details>
    );
  }

  return (
    <nav className="toc" aria-label="文章目录">
      <h2>目录 / ON THIS PAGE</h2>
      {links}
    </nav>
  );
}
