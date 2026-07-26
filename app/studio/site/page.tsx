import { contentServices } from "../../composition/content";
import { requireStudioUser } from "../studio-auth";
import { StudioShell } from "../studio-shell";
import { SiteEditor } from "./site-editor";

export const dynamic = "force-dynamic";

export default async function StudioSitePage() {
  const user = await requireStudioUser("/studio/site");
  const settings = await contentServices.studio.site.getSettings();
  return (
    <StudioShell active="site" user={user}>
      <header className="studio-page-heading studio-editor-heading">
        <div>
          <p className="eyebrow">SITE CONFIGURATION</p>
          <h1>首页与主题</h1>
          <p>调整首屏、开场和强调色；布局与可访问性约束继续由设计系统保护。</p>
        </div>
      </header>
      <SiteEditor initial={settings} />
    </StudioShell>
  );
}
