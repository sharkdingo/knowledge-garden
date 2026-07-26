import type { Metadata } from "next";
import { contentServices } from "../composition/content";
import { SiteShell } from "../components/site-shell";
import { ProjectBrowser } from "./project-browser";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "项目",
  description: "从需求、架构到可以运行的东西：IoT、可视化与 AI 工作流项目。",
};

export default async function ProjectsPage() {
  const [projects, snapshot, profile] = await Promise.all([
    contentServices.projects.list(),
    contentServices.projects.getStatusSummary(),
    contentServices.site.getProfile(),
  ]);
  const intro = profile.pages.projects;
  return (
    <SiteShell active="projects">
      <main id="main-content" className="page-shell projects-page">
        <header className="page-intro compact-intro">
          <p className="eyebrow">{intro.eyebrow}</p>
          <h1>{intro.title}</h1>
          <p>{intro.description}</p>
          <small>{projects.length} 个持续演进的项目</small>
        </header>
        <ProjectBrowser projects={projects} />
        {projects.length > 0 && <section className="activity-panel" aria-labelledby="activity-title">
          <div>
            <h2 id="activity-title">PROJECT SNAPSHOT / 当前状态</h2>
            <p>状态来自当前项目目录，用于说明投入阶段，不代表外部平台统计。</p>
          </div>
          <dl>
            {Object.entries(snapshot).map(([status, count]) => (
              <div key={status}><dt>{status.toUpperCase()}</dt><dd>{count}</dd></div>
            ))}
          </dl>
        </section>}
      </main>
    </SiteShell>
  );
}
