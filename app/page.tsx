import Image from "next/image";
import Link from "next/link";
import { SiteShell } from "./components/site-shell";
import { HomeExperience } from "./components/home-experience";
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
  const featured = articles.filter((article) => article.featured).slice(0, 3);
  const startingArticle = featured[0] ?? articles[0];
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

  return (
    <SiteShell active="home">
      <main id="main-content" className="home-page">
        <HomeExperience intro={hero.intro}>
          <section className="intro-stage" aria-labelledby="hero-title">
            <div className="intro-media" aria-hidden="true">
              <Image src={hero.image} alt="" fill priority sizes="100vw" />
            </div>
            <div className="intro-shade" />
            <div className="intro-grid" aria-hidden="true" />
            <div className="intro-content">
              <p className="eyebrow">{hero.eyebrow}</p>
              <h1 id="hero-title">
                {(hero.titleLines ?? [hero.title]).map((line) => <span key={line}>{line}</span>)}
              </h1>
              <p className="hero-lede">{hero.lead}</p>
              <div className="hero-actions">
                <Link className="button button-primary" href={hero.primaryAction.href}>
                  {hero.primaryAction.label} <span aria-hidden="true">→</span>
                </Link>
                <Link className="button button-glass" href={hero.secondaryAction.href}>
                  {hero.secondaryAction.label}
                </Link>
              </div>
              <div className="now-line" aria-label="当前正在构建">
                <span aria-hidden="true" />
                <small>{hero.nowLabel}</small>
                <strong>{hero.nowValue}</strong>
              </div>
            </div>
            <p className="intro-caption">{hero.caption}</p>
            <a className="scroll-cue" href="#garden">
              <span>{hero.scrollLabel}</span><i aria-hidden="true" />
            </a>
          </section>
        </HomeExperience>

        <div id="garden" className="page-shell home-garden">
          <ContinueReading articles={articles} label={home.continueLabel} />

          {daily && <DailySignal experience={daily} config={profile.daily} />}

          {hasPublishedContent ? <section className="home-start" aria-labelledby="home-start-title">
            <header>
              <p className="eyebrow">{home.eyebrow}</p>
              <h2 id="home-start-title">{home.title}</h2>
              <p>{home.description}</p>
            </header>
            <div className="home-start-grid">
              {startingArticle && (
                <Link className="home-start-card start-writing" href={`/writing/${startingArticle.slug}`}>
                  <span>{home.writingLabel}</span>
                  <strong>{startingArticle.title}</strong>
                  <p>{startingArticle.summary}</p>
                  <small>{startingArticle.category} · {startingArticle.minutes} 分钟阅读 <b aria-hidden="true">→</b></small>
                </Link>
              )}
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
                <small>每日内容图谱 <b aria-hidden="true">↗</b></small>
              </Link>
            </div>
          </section> : (
            <ContentEmptyState
              eyebrow="KNOWLEDGE GARDEN / READY"
              title="第一批真实内容正在生长"
              description="这里不会用示例文章填满空白。文章、题解与项目从内容工作室发布后，会自动进入首页、搜索和知识星图。"
              action={{ href: "/about", label: "先认识 shakdingo" }}
            />
          )}

          {featured.length > 0 && <section className="featured-section" aria-labelledby="featured-title">
            <div className="section-heading-row">
              <div>
                <p className="eyebrow">SELECTED WRITING</p>
                <h2 id="featured-title">精选文章</h2>
              </div>
              <Link href="/writing">全部文章 <span aria-hidden="true">→</span></Link>
            </div>
            <div className="featured-list">
              {featured.map((article, index) => (
                <article className="article-card" key={article.slug}>
                  <time dateTime={article.date}>{article.displayDate}</time>
                  <div>
                    <p>{article.category} · {article.minutes} 分钟</p>
                    <h3><Link href={`/writing/${article.slug}`}>{article.title}</Link></h3>
                    <p className="article-summary">{article.summary}</p>
                  </div>
                  <span className="article-number" aria-hidden="true">0{index + 1}</span>
                  <Link className="card-link" href={`/writing/${article.slug}`} aria-label={`阅读《${article.title}》`}>→</Link>
                </article>
              ))}
            </div>
          </section>}
        </div>
      </main>
    </SiteShell>
  );
}
