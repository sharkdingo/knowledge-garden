import { contentServices } from "../../../composition/content";
import { requireStudioUser } from "../../studio-auth";
import { StudioShell } from "../../studio-shell";
import { ProblemEditor } from "../problem-editor";

export const dynamic = "force-dynamic";

export default async function NewProblemPage() {
  const user = await requireStudioUser("/studio/problems/new");
  const profile = await contentServices.site.getProfile();
  return (
    <StudioShell active="algorithms" user={user}>
      <header className="studio-page-heading studio-editor-heading">
        <div>
          <p className="eyebrow">NEW ALGORITHM NOTE</p>
          <h1>新建题解</h1>
          <p>先记录题号与思路，只有完整的题解才能发布。</p>
        </div>
      </header>
      <ProblemEditor problem={null} authoring={profile.algorithmAuthoring} />
    </StudioShell>
  );
}
