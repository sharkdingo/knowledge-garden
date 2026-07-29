import Link from "next/link";
import { contentServices } from "../../composition/content";
import { requireStudioUser } from "../studio-auth";
import { StudioShell } from "../studio-shell";
import { isScheduledArticleLive } from "../../domain/studio";

export const dynamic = "force-dynamic";

export default async function StudioArticlesPage() {
  const user = await requireStudioUser("/studio/articles");
  const articles = await contentServices.studio.articles.list();

  return (
    <StudioShell active="articles" user={user}>
      <header className="studio-page-heading">
        <div>
          <p className="eyebrow">WRITING / {articles.length} ITEMS</p>
          <h1>文章管理</h1>
          <p>草稿不会出现在公开站点；发布操作和正文关系会在一次保存中完成。</p>
        </div>
        <Link className="button button-primary" href="/studio/articles/new">
          新建文章 <span aria-hidden="true">＋</span>
        </Link>
      </header>

      <section className="studio-table" aria-label="文章列表">
        <div className="studio-table-head" aria-hidden="true">
          <span>文章</span><span>分类</span><span>状态</span><span>日期</span><span>操作</span>
        </div>
        {articles.map((article) => (
          <article key={article.slug}>
            <div>
              <strong>{article.title || "未命名草稿"}</strong>
              <small>/{article.slug}{article.featured ? " · 精选" : ""}</small>
            </div>
            <span>{article.categoryName}</span>
            <i className={`studio-status status-${article.status}`}>
              {article.status === "published"
                ? "已发布"
                : article.status === "scheduled"
                  ? isScheduledArticleLive(article.status, article.publishedAt)
                    ? "定时已生效"
                    : "定时发布"
                  : article.status === "archived" ? "已归档" : "草稿"}
            </i>
            <time dateTime={article.publishedAt}>{article.updatedLabel}</time>
            <div className="studio-row-actions">
              {(article.status === "published" ||
                isScheduledArticleLive(article.status, article.publishedAt)) && (
                <Link
                  href={`/writing/${article.slug}`}
                  aria-label={`查看《${article.title || "未命名草稿"}》的公开页面`}
                >
                  查看
                </Link>
              )}
              <Link
                href={`/studio/articles/${article.slug}`}
                aria-label={`编辑《${article.title || "未命名草稿"}》`}
              >
                编辑 <span aria-hidden="true">→</span>
              </Link>
            </div>
          </article>
        ))}
        {!articles.length && (
          <div className="studio-empty compact">
            <strong>还没有文章</strong>
            <p>先创建草稿；只有主动发布后，内容才会出现在访客博客中。</p>
            <Link className="button button-primary" href="/studio/articles/new">
              创建第一篇文章
            </Link>
          </div>
        )}
      </section>
    </StudioShell>
  );
}
