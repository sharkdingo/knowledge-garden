# ADR 006: Protected Studio and content-derived play

## Status

Accepted.

## Context

D1 was already the canonical content source, but ordinary content changes still
required a migration and deployment. The existing games were mechanically
replayable but disconnected from the site's actual subject matter.

## Decision

Add a protected `/studio` authoring surface using platform authentication plus
an explicit D1 editor allowlist. Keep writes behind application services and a
dedicated D1 adapter. Save article metadata, sections, and tag relationships as
one batch after tag identities are resolved.

Replace the generic arcade presentation with a daily knowledge constellation
derived from published article/tag relationships. Persist only same-device
daily puzzle progress in browser storage.

Add a configurable first-visit entrance to the home profile. The experience is
skippable, replayable, keyboard-contained, and automatically bypassed when the
user requests reduced motion.

## Consequences

- Content can evolve without changing presentation source.
- Authentication and authorization remain separate and server-enforced.
- The public reading path does not depend on Studio code or client state.
- The game becomes a navigable expression of real content rather than a mock
  dataset.
- Mutable uploads remain a separate future capability and do not force an R2
  dependency before an image workflow exists.
