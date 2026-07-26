import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { contentServices } from "../../composition/content";
import { ArticleRenderer } from "../../components/article-renderer";
import { ArticleToc } from "../../components/article-toc";
import { ReadingProgress } from "../../components/reading-progress";
import { ArticleActions } from "../../components/article-actions";
import { ArticleEngagement } from "../../components/article-engagement";
import { SiteShell } from "../../components/site-shell";
import { ReadingFocus } from "../../components/reading-focus";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await contentServices.articles.get(slug);
  return article ? { title: article.title, description: article.summary } : { title: "文章未找到" };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const [reading, profile] = await Promise.all([
    contentServices.articles.getReadingView(slug),
    contentServices.site.getProfile(),
  ]);
  const { article, journey } = reading;
  if (!article) notFound();

  return (
    <SiteShell active="writing">
      <ReadingProgress slug={article.slug} />
      <ReadingFocus />
      <main id="main-content" className="article-page">
        <article id="article-document" className="article-content">
          <header className="article-header">
            <p className="eyebrow">WRITING / {article.category}</p>
            <h1>{article.title}</h1>
            <div className="article-meta">
              <time dateTime={article.date}>{article.date}</time>
              <span>·</span>
              <Link href={`/writing?category=${encodeURIComponent(article.category)}`}>
                {article.category}
              </Link>
              <span>·</span><span>约 {article.minutes} 分钟阅读</span>
            </div>
            <p>{article.summary}</p>
          </header>
          <ArticleToc sections={article.sections} compact />
          <div className="article-body">
            <ArticleRenderer article={article} />
          </div>
          <footer className="article-end">
            <div className="article-tags" aria-label="文章标签">
              {article.tags.map((tag) => (
                <Link href={`/explore?q=${encodeURIComponent(tag)}`} key={tag}>#{tag}</Link>
              ))}
            </div>
            <ArticleActions title={article.title} />
            <ArticleEngagement slug={article.slug} config={profile.engagement} />
            {journey.related.length > 0 && (
              <section className="related-reading" aria-labelledby="related-title">
                <p className="eyebrow">KEEP EXPLORING</p>
                <h2 id="related-title">沿着这些关系继续</h2>
                <div>
                  {journey.related.map((related) => (
                    <Link href={`/writing/${related.slug}`} key={related.slug}>
                      <span><small>{related.category}</small><strong>{related.title}</strong></span>
                      <b aria-hidden="true">→</b>
                    </Link>
                  ))}
                </div>
              </section>
            )}
            <nav className="article-sequence" aria-label="前后文章">
              {journey.previous ? (
                <Link href={`/writing/${journey.previous.slug}`}>
                  <small>上一篇</small><strong>{journey.previous.title}</strong>
                </Link>
              ) : <span />}
              {journey.next ? (
                <Link href={`/writing/${journey.next.slug}`}>
                  <small>下一篇</small><strong>{journey.next.title}</strong>
                </Link>
              ) : <span />}
            </nav>
          </footer>
        </article>

        <aside className="article-sidebar" aria-label="文章辅助信息">
          <ArticleToc sections={article.sections} />
        </aside>
      </main>
    </SiteShell>
  );
}
