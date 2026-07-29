import { contentServices } from "../../../composition/content";
import { ArticleEditor } from "../article-editor";
import { requireStudioUser } from "../../studio-auth";
import { StudioShell } from "../../studio-shell";

export const dynamic = "force-dynamic";

export default async function NewArticlePage() {
  const user = await requireStudioUser("/studio/articles/new");
  const categories = await contentServices.studio.articles.categories();
  if (!categories.length) {
    return (
      <StudioShell active="articles" user={user}>
        <div className="studio-bootstrap">
          <p className="eyebrow">FIRST STEP</p>
          <h1>先建立文章分类</h1>
          <p>文章必须属于一个分类。完成这一步后，编辑器会自动获得可选分类。</p>
          <a className="button button-primary" href="/studio/categories">创建第一个分类 →</a>
        </div>
      </StudioShell>
    );
  }
  return (
    <StudioShell active="articles" user={user}>
      <header className="studio-page-heading studio-editor-heading">
        <div>
          <p className="eyebrow">NEW ARTICLE</p>
          <h1>新建文章</h1>
          <p>默认保存为草稿；准备就绪后再切换为“已发布”。</p>
        </div>
      </header>
      <ArticleEditor article={null} categories={categories} serverDraft={null} revisions={[]} />
    </StudioShell>
  );
}
