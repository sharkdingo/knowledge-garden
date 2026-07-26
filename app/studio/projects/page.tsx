import Link from "next/link";
import { contentServices } from "../../composition/content";
import { requireStudioUser } from "../studio-auth";
import { StudioShell } from "../studio-shell";

export const dynamic = "force-dynamic";

export default async function StudioProjectsPage() {
  const user = await requireStudioUser("/studio/projects");
  const projects = await contentServices.studio.projects.list();
  const active = projects.filter((project) => !project.archived);

  return (
    <StudioShell active="projects" user={user}>
      <header className="studio-page-heading">
        <div>
          <p className="eyebrow">PROJECTS / {active.length} ACTIVE</p>
          <h1>项目管理</h1>
          <p>控制作品卡片、外部链接、关联文章与展示顺序；归档项目不会出现在访客页面。</p>
        </div>
        <Link className="button button-primary" href="/studio/projects/new">
          新建项目 <span aria-hidden="true">＋</span>
        </Link>
      </header>

      <section className="studio-table studio-project-table" aria-label="项目列表">
        <div className="studio-table-head" aria-hidden="true">
          <span>项目</span><span>分类</span><span>状态</span><span>排序</span><span />
        </div>
        {projects.map((project) => (
          <article key={project.id}>
            <div>
              <strong>{project.name}</strong>
              <small>/{project.id} · {project.subtitle}</small>
            </div>
            <span>{project.category}</span>
            <i className={`studio-status ${project.archived ? "status-archived" : "status-published"}`}>
              {project.archived ? "已归档" : project.statusLabel}
            </i>
            <span>{project.sortOrder}</span>
            <Link href={`/studio/projects/${project.id}`} aria-label={`编辑项目“${project.name}”`}>
              编辑 <span aria-hidden="true">→</span>
            </Link>
          </article>
        ))}
      </section>
    </StudioShell>
  );
}
