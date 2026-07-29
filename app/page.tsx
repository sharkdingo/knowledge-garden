import Link from "next/link";
import { SiteShell } from "./components/site-shell";
import { ContinueReading } from "./components/continue-reading";
import { DailySignal } from "./components/daily-signal";
import { ContentEmptyState } from "./components/content-empty-state";
import { contentServices } from "./composition/content";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [articles, projects, taxonomy, profile] = await Promise.all([
    contentServices.articles.list(),
    contentServices.projects.list(),
    contentServices.discovery.getTaxonomy(),
    contentServices.site.getProfile(),
  ]);
  const latestArticles = articles.slice(0, 5);
  const startingProject = projects[0];
  const hero = profile.hero;
  const home = profile.home;
  const daily = contentServices.daily.create({
    now: new Date(),
    articles,
    projects,
    tags: taxonomy.tags,
    config: profile.daily,
  });
  const hasPublishedContent = Boolean(articles.length || projects.length);
  const issueNumber = String(daily?.dayOfYear ?? 1).padStart(3, "0");

  return (
    <SiteShell active="home">
      <main id="main-content" className="home-page">
        <div className="page-shell editorial-home-shell">
          <section className="editorial-hero" aria-labelledby="hero-title">
            <aside className="editorial-index" aria-label={hero.eyebrow}>
              <strong>{hero.eyebrow}</strong>
              {daily && <time dateTime={daily.dateKey}>{daily.displayDate}</time>}
              <span>{profile.about.location}</span>
              <i aria-hidden="true" />
            </aside>

            <div className="editorial-hero-copy">
              <h1 id="hero-title">
                {(hero.titleLines ?? [hero.title]).map((line) => <span key={line}>{line}</span>)}
              </h1>
              <p className="hero-lede">{hero.lead}</p>
              <nav className="editorial-actions" aria-label={hero.scrollLabel}>
                <Link href={hero.primaryAction.href}>
                  {hero.primaryAction.label} <span aria-hidden="true">↗</span>
                </Link>
                <Link href={hero.secondaryAction.href}>
                  {hero.secondaryAction.label}
                </Link>
              </nav>
              <p className="editorial-now">
                <small>{hero.nowLabel}</small>
                <span>{hero.nowValue}</span>
              </p>
            </div>

            <strong className="editorial-issue" aria-hidden="true">{issueNumber}</strong>
          </section>

          <div id="garden" className="home-garden">
          <ContinueReading articles={articles} label={home.continueLabel} />

          {latestArticles.length > 0 && (
            <section className="featured-section home-latest" aria-labelledby="latest-writing-title">
              <div className="section-heading-row">
                <div>
                  <p className="eyebrow">{profile.pages.writing.eyebrow}</p>
                  <h2 id="latest-writing-title">{profile.pages.writing.title}</h2>
                  <p>{profile.pages.writing.description}</p>
                </div>
                <Link href="/writing">
                  {profile.pages.writing.title} <span aria-hidden="true">→</span>
                </Link>
              </div>
              <div className="featured-list">
                {latestArticles.map((article, index) => (
                  <article className="article-card" key={article.slug}>
                    <time dateTime={article.date}>{article.displayDate}</time>
                    <div>
                      <p>
                        {article.featured && <strong>推荐 · </strong>}
                        {article.category} · {article.minutes} 分钟
                      </p>
                      <h3><Link href={`/writing/${article.slug}`}>{article.title}</Link></h3>
                      <p className="article-summary">{article.summary}</p>
                    </div>
                    <span className="article-number" aria-hidden="true">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <Link
                      className="card-link"
                      href={`/writing/${article.slug}`}
                      aria-label={`阅读《${article.title}》`}
                    >
                      →
                    </Link>
                  </article>
                ))}
              </div>
            </section>
          )}

          {daily && <DailySignal experience={daily} config={profile.daily} />}

          {hasPublishedContent ? <section className="home-start" aria-labelledby="home-start-title">
            <header>
              <p className="eyebrow">{home.eyebrow}</p>
              <h2 id="home-start-title">{home.title}</h2>
              <p>{home.description}</p>
            </header>
            <div className="home-start-grid">
              <section className="home-start-card start-topics" aria-labelledby="home-topics-title">
                <span id="home-topics-title">{home.topicsLabel}</span>
                <div>
                  {taxonomy.categories.slice(0, 5).map((category) => (
                    <Link href={`/writing?category=${encodeURIComponent(category.value)}`} key={category.name}>
                      <strong>{category.name}</strong><small>{category.count}</small>
                    </Link>
                  ))}
                </div>
              </section>
              {startingProject && (
                <Link className="home-start-card start-project" href={`/projects#project-${startingProject.id}`}>
                  <span>{home.projectsLabel}</span>
                  <strong>{startingProject.name}</strong>
                  <p>{startingProject.subtitle}</p>
                  <small>{startingProject.stack.slice(0, 3).join(" · ")} <b aria-hidden="true">→</b></small>
                </Link>
              )}
              <Link className="home-start-card start-play" href="/play">
                <span>{home.playgroundLabel}</span>
                <strong>{profile.playground.constellation.title}</strong>
                <p>{profile.playground.constellation.description}</p>
                <small>{profile.playground.intro.eyebrow} <b aria-hidden="true">↗</b></small>
              </Link>
            </div>
          </section> : (
            <ContentEmptyState
              eyebrow={home.eyebrow}
              title={home.title}
              description={home.description}
              action={{ href: "/about", label: profile.about.intro.title }}
            />
          )}

          </div>
        </div>
      </main>
    </SiteShell>
  );
}
