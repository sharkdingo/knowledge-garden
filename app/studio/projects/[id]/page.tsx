import { notFound } from "next/navigation";
import { contentServices } from "../../../composition/content";
import { ProjectEditor } from "../project-editor";
import { requireStudioUser } from "../../studio-auth";
import { StudioShell } from "../../studio-shell";

export const dynamic = "force-dynamic";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireStudioUser(`/studio/projects/${id}`);
  const [project, articles] = await Promise.all([
    contentServices.studio.projects.get(id),
    contentServices.studio.articles.list(),
  ]);
  if (!project) notFound();
  return (
    <StudioShell active="projects" user={user}>
      <header className="studio-page-heading studio-editor-heading">
        <div>
          <p className="eyebrow">EDIT PROJECT / {project.archived ? "ARCHIVED" : "ACTIVE"}</p>
          <h1>{project.name}</h1>
          <p>更新项目叙事、链接与展示顺序；项目 ID 保持稳定。</p>
        </div>
      </header>
      <ProjectEditor project={project} articles={articles} />
    </StudioShell>
  );
}
