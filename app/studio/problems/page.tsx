import Link from "next/link";
import { contentServices } from "../../composition/content";
import { requireStudioUser } from "../studio-auth";
import { StudioShell } from "../studio-shell";

const difficultyLabel = { easy: "简单", medium: "中等", hard: "困难" } as const;
const statusLabel = { draft: "草稿", published: "已发布", archived: "已归档" } as const;

export const dynamic = "force-dynamic";

export default async function StudioProblemsPage() {
  const user = await requireStudioUser("/studio/problems");
  const problems = await contentServices.studio.algorithms.list();

  return (
    <StudioShell active="algorithms" user={user}>
      <header className="studio-page-heading">
        <div>
          <p className="eyebrow">ALGORITHMS / {problems.length} ITEMS</p>
          <h1>题库管理</h1>
          <p>集中维护题目来源、推导、复杂度、易错点和多语言实现。</p>
        </div>
        <Link className="button button-primary" href="/studio/problems/new">
          新建题解 <span aria-hidden="true">＋</span>
        </Link>
      </header>

      {problems.length ? (
        <section className="studio-table studio-problem-table" aria-label="题解列表">
          <div className="studio-table-head" aria-hidden="true">
            <span>题目</span><span>难度</span><span>状态</span><span>更新</span><span />
          </div>
          {problems.map((problem) => (
            <article key={problem.slug}>
              <div>
                <strong>{problem.title || "未命名题解"}</strong>
                <small>{problem.platform} / {problem.problemId} · {problem.solutionCount} 种解法</small>
              </div>
              <span>{difficultyLabel[problem.difficulty]}</span>
              <i className={`studio-status status-${problem.status}`}>{statusLabel[problem.status]}</i>
              <time dateTime={problem.updatedAt}>
                {new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium" }).format(new Date(problem.updatedAt))}
              </time>
              <Link href={`/studio/problems/${problem.slug}`} aria-label={`编辑《${problem.title || "未命名题解"}》`}>
                编辑 <span aria-hidden="true">→</span>
              </Link>
            </article>
          ))}
        </section>
      ) : (
        <section className="studio-empty">
          <strong>还没有真实题解</strong>
          <p>从你刚刚完成的一道题开始，先保存为草稿，再逐步补全推导和代码。</p>
          <Link className="button button-primary" href="/studio/problems/new">创建第一篇题解</Link>
        </section>
      )}
    </StudioShell>
  );
}
