import { notFound } from "next/navigation";
import { contentServices } from "../../../composition/content";
import { requireStudioUser } from "../../studio-auth";
import { StudioShell } from "../../studio-shell";
import { ProblemEditor } from "../problem-editor";

export const dynamic = "force-dynamic";

export default async function EditProblemPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await requireStudioUser(`/studio/problems/${slug}`);
  const [problem, profile] = await Promise.all([
    contentServices.studio.algorithms.get(slug),
    contentServices.site.getProfile(),
  ]);
  if (!problem) notFound();

  return (
    <StudioShell active="algorithms" user={user}>
      <header className="studio-page-heading studio-editor-heading">
        <div>
          <p className="eyebrow">EDIT ALGORITHM / {problem.status.toUpperCase()}</p>
          <h1>{problem.title || "未命名题解"}</h1>
          <p>题目永久链接保持稳定；保存时会原子更新解法、代码和标签。</p>
        </div>
      </header>
      <ProblemEditor problem={problem} authoring={profile.algorithmAuthoring} />
    </StudioShell>
  );
}
