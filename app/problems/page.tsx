import type { Metadata } from "next";
import { SiteShell } from "../components/site-shell";
import { contentServices } from "../composition/content";
import { ProblemArchive } from "./problem-archive";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const profile = await contentServices.site.getProfile();
  return {
    title: profile.pages.algorithms.title,
    description: profile.pages.algorithms.description,
  };
}

export default async function ProblemsPage() {
  const [problems, profile] = await Promise.all([
    contentServices.algorithms.list(),
    contentServices.site.getProfile(),
  ]);
  const solutionCount = problems.reduce((sum, problem) => sum + problem.solutionCount, 0);
  const languageCount = new Set(problems.flatMap((problem) => problem.languages)).size;

  return (
    <SiteShell active="algorithms">
      <main id="main-content" className="algorithm-index page-shell">
        <header className="page-intro algorithm-intro">
          <p className="eyebrow">{profile.pages.algorithms.eyebrow}</p>
          <h1>{profile.pages.algorithms.title}</h1>
          <p>{profile.pages.algorithms.description}</p>
          <dl aria-label={profile.algorithmHub.statsLabel}>
            <div><dt>{profile.algorithmHub.publishedStatLabel}</dt><dd>{problems.length}</dd></div>
            <div><dt>{profile.algorithmHub.solutionsStatLabel}</dt><dd>{solutionCount}</dd></div>
            <div><dt>{profile.algorithmHub.languagesStatLabel}</dt><dd>{languageCount}</dd></div>
          </dl>
        </header>
        <ProblemArchive problems={problems} config={profile.algorithmHub} />
      </main>
    </SiteShell>
  );
}
