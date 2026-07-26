import Link from "next/link";
import { contentServices } from "../composition/content";
import { requireStudioUser } from "./studio-auth";
import { StudioShell } from "./studio-shell";
import { isScheduledArticleLive } from "../domain/studio";

export const dynamic = "force-dynamic";

export default async function StudioPage() {
  const user = await requireStudioUser("/studio");
  const [overview, articles, engagement, engagementConfig] = await Promise.all([
    contentServices.studio.articles.getOverview(),
    contentServices.studio.articles.list(),
    contentServices.engagement.getOverview(),
    contentServices.engagement.getConfig(),
  ]);
  const recent = articles.slice(0, 5);

  return (
    <StudioShell active="overview" user={user}>
      <header className="studio-page-heading">
        <div>
          <p className="eyebrow">EDITORIAL CONTROL PLANE</p>
          <h1>内容工作室</h1>
          <p>内容、首页与主题从这里进入 D1；保存后立即成为站点的唯一真实数据。</p>
        </div>
        <Link className="button button-primary" href="/studio/articles/new">
          新建文章 <span aria-hidden="true">＋</span>
        </Link>
      </header>

      <section className="studio-metrics" aria-label="内容概览">
        <article><strong>{overview.published}</strong><span>已发布</span></article>
        <article><strong>{overview.scheduled}</strong><span>定时发布</span></article>
        <article><strong>{overview.drafts}</strong><span>草稿</span></article>
        <article><strong>{engagement.total}</strong><span>读者回应</span></article>
      </section>

      <div className="studio-dashboard-grid">
        <section className="studio-panel" aria-labelledby="recent-content-title">
          <header>
            <div>
              <p className="eyebrow">RECENT CONTENT</p>
              <h2 id="recent-content-title">最近内容</h2>
            </div>
            <Link href="/studio/articles">管理全部</Link>
          </header>
          <div className="studio-content-list">
            {recent.map((article) => (
              <Link href={`/studio/articles/${article.slug}`} key={article.slug}>
                <span>
                  <strong>{article.title || "未命名草稿"}</strong>
                  <small>{article.categoryName} · {article.updatedLabel}</small>
                </span>
                <i className={`studio-status status-${article.status}`}>
                  {article.status === "published"
                    ? "已发布"
                    : article.status === "scheduled"
                      ? isScheduledArticleLive(article.status, article.publishedAt)
                        ? "定时已生效"
                        : "定时发布"
                      : article.status === "archived" ? "已归档" : "草稿"}
                </i>
              </Link>
            ))}
            {!recent.length && (
              <div className="studio-empty compact">
                <strong>还没有内容记录</strong>
                <p>从新建文章或题解开始，草稿也会安全保存在工作室中。</p>
              </div>
            )}
          </div>
        </section>

        <aside className="studio-panel studio-quick-panel" aria-labelledby="quick-title">
          <header>
            <div>
              <p className="eyebrow">QUICK ACTIONS</p>
              <h2 id="quick-title">快捷入口</h2>
            </div>
          </header>
          <Link href="/studio/articles/new"><span>撰写新文章</span><b>→</b></Link>
          <Link href="/studio/problems/new"><span>记录一道算法题</span><b>→</b></Link>
          <Link href="/studio/projects"><span>维护项目作品</span><b>→</b></Link>
          <Link href="/studio/site"><span>调整首页与主题</span><b>→</b></Link>
          <Link href="/play"><span>检查知识星图</span><b>↗</b></Link>
        </aside>
      </div>

      <section className="studio-panel studio-engagement-overview" aria-labelledby="reader-response-title">
        <header>
          <div>
            <p className="eyebrow">READER SIGNAL</p>
            <h2 id="reader-response-title">读者回应</h2>
          </div>
          <Link href="/studio/site#engagement-settings-title">调整回应选项</Link>
        </header>
        {engagement.articles.length ? (
          <div className="studio-response-list">
            {engagement.articles.map((article) => (
              <Link href={`/writing/${article.slug}`} key={article.slug}>
                <span>
                  <strong>{article.title}</strong>
                  <small>
                    {article.counts.map((count) => {
                      const option = engagementConfig.options.find((item) => item.id === count.id);
                      return `${option?.label ?? count.id} ${count.count}`;
                    }).join(" · ")}
                  </small>
                </span>
                <b>{article.total}</b>
              </Link>
            ))}
          </div>
        ) : (
          <div className="studio-empty compact">
            <strong>还没有读者回应</strong>
            <p>访客在文章末尾选择后，真实统计会出现在这里。</p>
          </div>
        )}
      </section>
    </StudioShell>
  );
}
