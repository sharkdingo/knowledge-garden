import { contentServices } from "../../../composition/content";
import { ProjectEditor } from "../project-editor";
import { requireStudioUser } from "../../studio-auth";
import { StudioShell } from "../../studio-shell";

export const dynamic = "force-dynamic";

export default async function NewProjectPage() {
  const user = await requireStudioUser("/studio/projects/new");
  const articles = await contentServices.studio.articles.list();
  return (
    <StudioShell active="projects" user={user}>
      <header className="studio-page-heading studio-editor-heading">
        <div>
          <p className="eyebrow">NEW PROJECT</p>
          <h1>新建项目</h1>
          <p>项目保存后进入作品页；可先用实时预览检查卡片信息层级。</p>
        </div>
      </header>
      <ProjectEditor project={null} articles={articles} />
    </StudioShell>
  );
}
