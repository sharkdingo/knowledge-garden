import type { Metadata } from "next";
import { SiteShell } from "../components/site-shell";
import { contentServices } from "../composition/content";
import { KnowledgeConstellation } from "./knowledge-constellation";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { playground } = await contentServices.site.getProfile();
  return {
    title: playground.intro.title,
    description: playground.intro.description,
  };
}

export default async function PlayPage() {
  const [{ playground }, articles] = await Promise.all([
    contentServices.site.getProfile(),
    contentServices.articles.list(),
  ]);
  const dateKey = new Date().toISOString().slice(0, 10);
  return (
    <SiteShell active="play">
      <main id="main-content" className="page-shell play-page">
        <header className="page-intro compact-intro play-intro">
          <p className="eyebrow">{playground.intro.eyebrow}</p>
          <h1>{playground.intro.title}</h1>
          <p>{playground.intro.description}</p>
          <small>{playground.lead}</small>
        </header>
        <KnowledgeConstellation
          config={playground.constellation}
          articles={articles}
          dateKey={dateKey}
        />
      </main>
    </SiteShell>
  );
}
