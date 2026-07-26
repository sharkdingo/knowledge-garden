import Link from "next/link";

export function ContentEmptyState({
  eyebrow = "EMPTY / READY",
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: { href: string; label: string };
}) {
  return (
    <section className="content-empty-state" aria-label={title}>
      <span aria-hidden="true">∅</span>
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      <p>{description}</p>
      {action && <Link href={action.href}>{action.label} <b aria-hidden="true">→</b></Link>}
    </section>
  );
}
