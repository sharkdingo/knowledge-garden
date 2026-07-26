# ADR 008: Persisted reader signals

## Status

Accepted.

## Context

The site should respond to visitors without interrupting long-form reading.
The owner also needs evidence about which ideas resonate. Static reaction
options, fake counters, and browser-only votes would conflict with D1 as the
site's source of truth and would make Studio analytics misleading.

## Decision

Article-end responses use a dedicated domain port and application service.
The public route depends on that service, while `D1EngagementRepository` owns
all persistence queries. Each article and anonymous device key has at most one
response; a visitor can change or remove it.

Response options and every visitor-facing string live in the typed site profile
stored in `site_settings`. Counts and selections live in `article_reactions`.
Studio edits the profile configuration and reads real aggregate counts through
the same application service.

The browser stores only a random UUID. It is not a user account, is not combined
with personal information, and exists solely to retrieve or replace that
device's response.

## Consequences

- No public component embeds reaction options, labels, sample counts, or
  fallback copy.
- Invalid or duplicate option IDs are rejected before persistence.
- Foreign-key cascading removes reactions with their article.
- The feature remains replaceable behind its repository port if a higher-volume
  analytics store becomes necessary.
- Device-local identity is intentionally limited: clearing browser storage
  creates a new anonymous identity.
