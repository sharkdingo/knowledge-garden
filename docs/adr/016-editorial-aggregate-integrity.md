# ADR 016: Editorial aggregate integrity

## Status

Accepted.

## Context

Article saves crossed several persistence operations: the article aggregate was
updated first, while recovery-draft deletion and revision retention happened
afterward. A maintenance failure could therefore report a failed save after
content had committed. Tag preparation also occurred before the guarded article
batch, so a stale writer could create unattached taxonomy rows.

Server recovery drafts were modeled as article-owned data in the application,
but the database did not enforce that ownership. Concurrent maintenance or
restore work could leave a draft whose article no longer existed.

Studio clients independently implemented network and JSON handling. Some paths
could remain permanently busy after a rejected promise, and session expiry or a
non-JSON gateway response produced inconsistent feedback.

## Decision

- Article content, relationships, recovery-draft cleanup, revision creation,
  revision retention, and write-token release execute in one optimistic D1
  batch.
- Article and algorithm tag creation is guarded by the owning aggregate's write
  token. A stale writer performs no taxonomy mutation.
- `article_drafts.article_slug` references `articles.slug` with cascading
  deletion. The migration discards any pre-existing orphan draft.
- Category deletion returns an explicit `deleted`, `in-use`, or `missing`
  domain result from one transactional repository operation.
- Every Studio client mutation uses `studioRequest`, which owns network,
  cancellation, authentication-expiry, JSON-decoding, and server-error
  semantics. Feature components own only their workflow-specific state.

## Consequences

Save acknowledgements now correspond to a complete aggregate commit. Stale
editors cannot leave taxonomy debris, recovery state cannot outlive its article,
and failed client requests consistently release busy state while preserving
unsaved form data.
