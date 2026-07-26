import type { ArticleDocument } from "../domain/content";

export function ArticleRenderer({ article }: { article: ArticleDocument }) {
  return (
    <>
      <p>{article.lead}</p>
      {article.callout && (
        <section className="terminal-callout" aria-label={article.callout.label}>
          <strong>{article.callout.label} <span aria-hidden="true">›_</span></strong>
          <code>
            {article.callout.lines.map((line, index) => (
              <span key={`${index}-${line}`}>{line}</span>
            ))}
          </code>
        </section>
      )}
      {article.quote && <blockquote>{article.quote}</blockquote>}
      {article.sections.map((section) => (
        <section key={section.id} aria-labelledby={section.id}>
          <h2 id={section.id}>{section.title}</h2>
          {section.paragraphs.map((paragraph, index) => (
            <p key={`${section.id}-${index}`}>{paragraph}</p>
          ))}
        </section>
      ))}
    </>
  );
}
