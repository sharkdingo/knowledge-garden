# ADR 015: One Studio API response boundary

## Status

Accepted.

## Context

Studio routes previously classified validation, concurrency, and infrastructure
errors independently. That duplicated presentation policy across resources,
produced inconsistent status codes, omitted `no-store` on some responses, and
could expose an unexpected adapter error message to the browser.

Site-profile updates also changed the profile before removing reactions for
options that no longer existed. A cleanup failure could therefore report a
failed save after the profile had already committed.

## Decision

- `app/studio/studio-response.ts` is the sole JSON response policy for Studio.
- Validation errors remain actionable and use `400` unless a use case explicitly
  assigns a different client status.
- Optimistic-concurrency conflicts use `409`.
- Unexpected errors use a route-owned generic message and never expose adapter
  details.
- Every Studio JSON response is marked `Cache-Control: no-store`.
- Site-profile replacement and obsolete-reaction cleanup execute in one D1
  batch. Both statements use the same expected profile version, so stale
  clients neither update the profile nor delete current reactions.

## Consequences

Routes retain only transport orchestration and use-case-specific fallback copy.
Error policy can evolve without editing every resource route. The profile and
its response vocabulary now cross the persistence boundary atomically.
