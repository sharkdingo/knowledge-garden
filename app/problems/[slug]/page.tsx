import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MathText } from "../../components/math-text";
import { SiteShell } from "../../components/site-shell";
import { contentServices } from "../../composition/content";
import { AlgorithmCodeDeck } from "./algorithm-code-deck";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [problem, profile] = await Promise.all([
    contentServices.algorithms.get(slug),
    contentServices.site.getProfile(),
  ]);
  return problem
    ? { title: `${problem.platform} ${problem.problemId}. ${problem.title}`, description: problem.summary }
    : { title: profile.algorithmHub.missingTitle };
}

export default async function ProblemPage({ params }: Props) {
  const { slug } = await params;
  const [problem, profile] = await Promise.all([
    contentServices.algorithms.get(slug),
    contentServices.site.getProfile(),
  ]);
  if (!problem) notFound();
  const copy = profile.algorithmHub;

  return (
    <SiteShell active="algorithms">
      <main id="main-content" className="algorithm-problem page-shell">
        <article>
          <header className="algorithm-problem-header">
            <div className="algorithm-breadcrumb">
              <Link href="/problems">{copy.hubLabel}</Link><span>/</span>
              <span>{problem.platform}</span><span>/</span>
              <span>{problem.problemId}</span>
            </div>
            <div className="algorithm-title-row">
              <div>
                <p className="eyebrow">{problem.platform} / {problem.problemId}</p>
                <h1>{problem.title}</h1>
              </div>
              <span className={`difficulty difficulty-${problem.difficulty}`}>
                {copy.difficultyLabels[problem.difficulty]}
              </span>
            </div>
            <p className="algorithm-summary"><MathText text={problem.summary} /></p>
            <div className="algorithm-problem-meta">
              <time dateTime={problem.solvedAt}>{copy.solvedLabel} {problem.solvedAt}</time>
              <span>{copy.solutionCountTemplate.replaceAll("{count}", String(problem.solutionCount))}</span>
              <span>{problem.languages.join(" · ")}</span>
              <a href={problem.sourceUrl} target="_blank" rel="noreferrer">
                {copy.sourceLabel} <span aria-hidden="true">↗</span>
              </a>
            </div>
            <div className="algorithm-tags">
              {problem.tags.map((tag) => <span key={tag}>#{tag}</span>)}
            </div>
          </header>

          <section className="algorithm-statement" id="statement">
            <p className="eyebrow">{copy.problemEyebrow}</p>
            <h2>{copy.statementTitle}</h2>
            <p><MathText text={problem.statement} /></p>
            {problem.constraints.length > 0 && (
              <aside>
                <h3>{copy.constraintsTitle}</h3>
                <ul>
                  {problem.constraints.map((constraint, index) => (
                    <li key={`${index}-${constraint}`}><MathText text={constraint} /></li>
                  ))}
                </ul>
              </aside>
            )}
          </section>

          <section className="algorithm-solutions" aria-labelledby="solutions-title">
            <header>
              <p className="eyebrow">{copy.approachesEyebrow} / {problem.solutions.length}</p>
              <h2 id="solutions-title">{copy.solutionsTitle}</h2>
            </header>
            {problem.solutions.length > 0 && (
              <section
                className="algorithm-approach-overview"
                aria-labelledby="approach-overview-title"
              >
                <h3 id="approach-overview-title">{copy.overviewTitle}</h3>
                <div>
                  <table>
                    <thead>
                      <tr>
                        <th scope="col">{copy.approachLabel}</th>
                        <th scope="col">{copy.timeLabel}</th>
                        <th scope="col">{copy.spaceLabel}</th>
                        <th scope="col">{copy.implementationsLabel}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {problem.solutions.map((solution, index) => (
                        <tr key={solution.id}>
                          <th scope="row">
                            <Link href={`#solution-${solution.id}`}>
                              {String(index + 1).padStart(2, "0")} {solution.title}
                            </Link>
                          </th>
                          <td><MathText text={solution.timeComplexity} /></td>
                          <td><MathText text={solution.spaceComplexity} /></td>
                          <td>
                            <div className="algorithm-language-badges">
                              {solution.codeBlocks.map((block) => (
                                <span key={block.id}>
                                  {block.label || block.language}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
            {problem.solutions.map((solution, solutionIndex) => (
              <article id={`solution-${solution.id}`} key={solution.id} className="algorithm-solution">
                <header>
                  <span>{String(solutionIndex + 1).padStart(2, "0")}</span>
                  <h3>{solution.title}</h3>
                </header>
                <section>
                  <h4>{copy.intuitionTitle}</h4>
                  <p><MathText text={solution.intuition} /></p>
                </section>
                <section>
                  <h4>{copy.stepsTitle}</h4>
                  <ol>
                    {solution.steps.map((step, index) => (
                      <li key={`${index}-${step}`}><MathText text={step} /></li>
                    ))}
                  </ol>
                </section>
                <section>
                  <h4>{copy.proofTitle}</h4>
                  <p><MathText text={solution.proof} /></p>
                </section>
                <section className="algorithm-complexity">
                  <h4>{copy.complexityTitle}</h4>
                  <dl>
                    <div><dt>{copy.timeLabel}</dt><dd><MathText text={solution.timeComplexity} /></dd></div>
                    <div><dt>{copy.spaceLabel}</dt><dd><MathText text={solution.spaceComplexity} /></dd></div>
                  </dl>
                </section>
                {solution.pitfalls.length > 0 && (
                  <section className="algorithm-pitfalls">
                    <h4>{copy.pitfallsTitle}</h4>
                    <ul>
                      {solution.pitfalls.map((pitfall, index) => (
                        <li key={`${index}-${pitfall}`}><MathText text={pitfall} /></li>
                      ))}
                    </ul>
                  </section>
                )}
                <AlgorithmCodeDeck blocks={solution.codeBlocks} config={copy} />
              </article>
            ))}
          </section>
          {problem.references.length > 0 && (
            <section
              className="algorithm-references"
              id="references"
              aria-labelledby="references-title"
            >
              <p className="eyebrow">SOURCES / {problem.references.length}</p>
              <h2 id="references-title">{copy.referencesTitle}</h2>
              <ol>
                {problem.references.map((reference) => {
                  const solutionIndex = reference.solutionId
                    ? problem.solutions.findIndex((solution) => solution.id === reference.solutionId)
                    : -1;
                  const scope = solutionIndex >= 0
                    ? `${String(solutionIndex + 1).padStart(2, "0")} ${problem.solutions[solutionIndex].title}`
                    : copy.referenceGeneralLabel;
                  return (
                    <li key={reference.id}>
                      <div>
                        <a href={reference.url} target="_blank" rel="noreferrer">
                          {reference.title} <span aria-hidden="true">↗</span>
                        </a>
                        <span>{scope}</span>
                      </div>
                      <p>
                        {copy.referenceAuthorLabel}：{reference.author}
                        <span aria-hidden="true"> · </span>
                        {copy.referenceAccessedLabel}：
                        <time dateTime={reference.accessedAt}>{reference.accessedAt}</time>
                      </p>
                      {reference.note && <p><MathText text={reference.note} /></p>}
                    </li>
                  );
                })}
              </ol>
            </section>
          )}
          <footer className="algorithm-problem-footer">
            <Link href="/problems"><span aria-hidden="true">←</span> {copy.hubLabel}</Link>
          </footer>
        </article>

        <aside className="algorithm-toc" aria-label={copy.tocLabel}>
          <p className="eyebrow">{copy.tocLabel}</p>
          <Link href="#statement">{copy.statementTitle}</Link>
          {problem.solutions.map((solution, index) => (
            <Link href={`#solution-${solution.id}`} key={solution.id}>
              {String(index + 1).padStart(2, "0")} {solution.title}
            </Link>
          ))}
          {problem.references.length > 0 && (
            <Link href="#references">{copy.referencesTitle}</Link>
          )}
        </aside>
      </main>
    </SiteShell>
  );
}
