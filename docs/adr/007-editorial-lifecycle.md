# ADR 007: Durable editorial lifecycle

## Status

Accepted.

## Context

Browser-only recovery protected work on one device, but it could not survive a
device change and did not provide committed version history. Editing an already
published article also needed a clear distinction between a recovery copy and
visitor-visible content.

## Decision

Keep the public article as the explicit committed state. Store debounced
recovery copies separately in `article_drafts`, and remove them after a
successful explicit save. Store each committed state in
`article_revisions`, retaining the newest thirty snapshots per article.

All autosave, restore, scheduling, publishing, and archive operations pass
through the authenticated Studio API, application validation, domain repository
port, and D1 adapter. A scheduled article becomes public when its persisted
publish time is due; the stateless Worker evaluates this in public content
queries.

## Consequences

- Automatic recovery cannot accidentally change public content.
- A writer can recover work across devices.
- Explicit saves and lifecycle changes are reversible.
- Existing articles receive a baseline snapshot on their first post-migration
  update.
- Revision storage stays bounded without a separate cleanup service.
- Publishing remains stateless and does not depend on a cron worker.
