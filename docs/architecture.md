# Architecture

The site is a cloud-native, server-first modular monolith. It runs as a
stateless Cloudflare Worker through Vinext, stores structured product data in
D1, and serves immutable visual assets through the deployment edge.

## Dependency direction

```text
Presentation (routes and React components)
        ↓
Application (use-case services)
        ↓
Domain (models and repository ports)
        ↑
Infrastructure (D1 repository adapter)
        ↑
Composition (concrete dependency wiring)
```

This keeps SOLID boundaries practical:

- pages depend on use cases rather than SQL;
- services depend on focused repository interfaces;
- the D1 adapter owns query, mapping, and JSON validation details;
- the composition root is the only place that selects infrastructure;
- client components own browser interaction only.

## Runtime topology

| Concern | Runtime |
| --- | --- |
| Server rendering and routes | Stateless Cloudflare Worker |
| Articles, algorithm notes, taxonomy, projects, site profile | D1 |
| Recovery drafts, revisions, reader signals, and authoring writes | D1 |
| Editor allowlist | Runtime secret configuration |
| Schema and canonical site configuration | Versioned Drizzle migrations |
| Images and compiled assets | Edge-served deployment assets |
| Device-only theme, reading preference, and anonymous reader key | `localStorage` |
| Health/readiness | `/api/health` with a live D1 query |

D1 is the source of truth for navigation, site identity, page copy, theme
tokens, easter-egg messages, article bodies, sections, categories, tags, and
project data. Article-response labels and options also come from the profile;
their counts come from D1. There is no static catalog, mock count, or
browser-storage content fallback.

## Data model

- `site_settings`: typed site profile, page copy, theme, and experience config.
- `navigation_items`: ordered header and footer navigation.
- `categories`, `articles`, `article_sections`: editorial writing hierarchy.
- `article_drafts`: server-side recovery copies that never affect visitors.
- `article_revisions`: bounded, restorable snapshots of committed article state.
- `article_reactions`: one mutable anonymous response per article and device.
- `tags`, `article_tags`: searchable many-to-many taxonomy.
- `algorithm_problems`: platform metadata, authored statement, publication state,
  and source link.
- `algorithm_solutions`: ordered intuition, derivation, proof, complexity, and
  pitfalls for each problem.
- `algorithm_code_blocks`: ordered language implementations for each solution.
- `algorithm_problem_tags`: shared searchable taxonomy for algorithm notes.
- `algorithm_references`: ordered, attributable external sources scoped to a
  whole problem or one solution.
- `projects`: project status, stack, links, and related writing.

Indexes cover publish ordering, category lookup, navigation ordering, article
section ordering, revision history, and project ordering. Foreign keys preserve
content graph integrity and cascade responses when an article is removed.
Scheduled content becomes readable through a
time-aware public query, so publishing does not require a stateful runtime job.

## Rendering and interaction

React Server Components perform all content reads. Client JavaScript is limited
to menus, filters, weighted search, theme preference, reading preferences,
reading progress, and optional easter eggs. The immersive home stage includes a
motion-reduced fallback; all controls remain keyboard and touch accessible.
The anonymous browser key contains no profile data and only lets a reader
change or remove their own response. Response options, result messages, and
privacy copy stay editable in Studio; the visitor interface never invents
fallback content when the profile is incomplete.

Every D1-backed public route is explicitly dynamic. This makes Studio saves,
publishing transitions, taxonomy changes, RSS, and sitemap entries observable
from the persisted source of truth without relying on framework heuristics or a
stale static snapshot. Article detail reads use one reading-view use case for
the document and its onward journey; direct metadata lookups use a
slug-targeted public query rather than loading the complete archive.

`/studio` is a sign-in-gated authoring surface. Authentication comes from the
hosting platform; authorization is checked against the runtime-only
`STUDIO_EDITOR_EMAILS` allowlist for every page and write endpoint. This keeps
editor identities out of public source and content migrations. On localhost,
an explicit loopback-only identity shortcut replaces the unavailable hosted
sign-in endpoint while preserving the same authorization check. Studio pages
call application services, while the D1 write adapter owns prepared statements
and atomic article/relationship batches.
Automatic recovery writes into `article_drafts`, not the public article record.
Explicit saves create a bounded revision snapshot, and restore operations pass
through the same validation and repository boundary as ordinary updates.
Published and already-live scheduled articles expose a direct public-page link
in Studio, closing the owner verification loop without exposing draft URLs.
Reader-response routes call a dedicated application service; only the D1
engagement adapter can issue response SQL. Studio reads the same persisted
aggregate instead of presenting sample analytics.

The playground derives its daily constellation from published article/tag
relationships. Only the current device's puzzle progress is browser-local; the
knowledge graph itself remains D1-backed content.

`/problems` is the public algorithm notebook; `/studio/problems` is its
authenticated authoring surface. It uses a dedicated aggregate rather than
overloading article sections. Published aggregates flow into the global search,
RSS, and sitemap. Visitor-facing notebook labels are read from the D1 profile,
and the public archive presents an honest empty state until the owner publishes
real work.

Algorithm drafts require only platform, problem number, slug, and solved date;
publishing activates stricter aggregate validation for explanation,
correctness, complexity, and code. The D1 adapter namespaces internal IDs and
writes tag creation plus every nested relationship in one atomic batch. Public
multi-language code tabs implement the tab keyboard pattern and expose copy
success or failure through persisted interface copy. A persisted
solution-by-language matrix makes every implementation visible before a reader
opens a code tab. Explanation fields accept bounded TeX delimiters and are
server-rendered with KaTeX using MathML output and disabled trust. References
carry title, author, canonical URL, access date, scope, and an owner-authored
borrowing note; they are deleted before solutions during aggregate replacement
to preserve foreign-key integrity. LeetCode-first platform and language
shortcuts are authoring configuration in D1, not component constants.

The architecture intentionally remains one edge-deployed application. Separate
microservices would add network failure modes without independent scaling or
ownership requirements. New adapters can still be introduced behind the
existing domain ports when a real need appears.

## Change workflow

1. Change `db/schema.ts`.
2. Generate and inspect Drizzle SQL.
3. Keep migrations free of sample visitor content.
4. Keep queries inside `app/infrastructure`.
5. Rebuild a clean local D1 and run lint, build, migration integrity tests, and
   interaction checks before deployment.

Local D1 and the production D1 are separate operational stores. Vite and the
local migration CLI share `.wrangler/state/v3`; the hosting platform applies
the same packaged migration directory to production.
