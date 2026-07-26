import { notFound } from "next/navigation";
import { contentServices } from "../../../composition/content";
import { ArticleEditor } from "../article-editor";
import { requireStudioUser } from "../../studio-auth";
import { StudioShell } from "../../studio-shell";

export const dynamic = "force-dynamic";

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <EditArticleContent slug={slug} />;
}

async function EditArticleContent({ slug }: { slug: string }) {
  const user = await requireStudioUser(`/studio/articles/${slug}`);
  const [article, categories, draft, revisions] = await Promise.all([
    contentServices.studio.articles.get(slug),
    contentServices.studio.articles.categories(),
    contentServices.studio.articles.draft(slug),
    contentServices.studio.articles.revisions(slug),
  ]);
  if (!article) notFound();
  return (
    <StudioShell active="articles" user={user}>
      <header className="studio-page-heading studio-editor-heading">
        <div>
          <p className="eyebrow">EDIT ARTICLE / {article.status.toUpperCase()}</p>
          <h1>{article.title || "未命名草稿"}</h1>
          <p>更新正文、结构与发布状态；永久链接保持稳定。</p>
        </div>
      </header>
      <ArticleEditor
        article={article}
        categories={categories}
        serverDraft={draft}
        revisions={[...revisions]}
      />
    </StudioShell>
  );
}
