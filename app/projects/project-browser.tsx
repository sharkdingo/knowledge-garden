"use client";

import Link from "next/link";
import { useState } from "react";
import { ProjectVisual } from "../components/project-visual";
import type { Project } from "../domain/content";
import { ContentEmptyState } from "../components/content-empty-state";

export function ProjectBrowser({ projects }: { projects: Project[] }) {
  const filters = ["全部", ...new Set(projects.map((project) => project.category))];
  const [filter, setFilter] = useState("全部");

  if (!projects.length) {
    return (
      <ContentEmptyState
        eyebrow="PROJECTS / READY"
        title="还没有公开项目"
        description="项目从内容工作室发布后才会出现在这里；空状态不会伪造活跃度或项目记录。"
      />
    );
  }
  const visible = filter === "全部" ? projects : projects.filter((project) => project.category === filter);

  return (
    <>
      <div className="project-filters" role="group" aria-label="筛选项目">
        {filters.map((item) => (
          <button
            key={item}
            type="button"
            className={item === filter ? "active" : undefined}
            aria-pressed={item === filter}
            onClick={() => setFilter(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <p className="result-summary" role="status">当前显示 {visible.length} / {projects.length} 个项目</p>
      <div className="project-grid">
        {visible.map((project) => (
          <article
            id={`project-${project.id}`}
            className={`project-card status-${project.status.toLowerCase()}`}
            key={project.id}
          >
            <ProjectVisual type={project.visual} />
            <p className="project-status">{project.status.toUpperCase()} · {project.statusLabel}</p>
            <h2>{project.name}</h2>
            <h3>{project.subtitle}</h3>
            <div className="stack-list">
              {project.stack.map((item) => <span key={item}>{item}</span>)}
            </div>
            <p>{project.description}</p>
            <footer>
              <small>UPDATED {project.updated}</small>
              <div>
                {project.links?.repository && <a href={project.links.repository} rel="noreferrer">GitHub ↗</a>}
                {project.links?.demo && <a href={project.links.demo} rel="noreferrer">Demo →</a>}
                {project.relatedArticleSlug && <Link href={`/writing/${project.relatedArticleSlug}`}>设计笔记 →</Link>}
              </div>
            </footer>
          </article>
        ))}
      </div>
    </>
  );
}
