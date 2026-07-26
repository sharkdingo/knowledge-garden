# ADR 003: Use focused services and an honest interaction contract

- Status: Accepted
- Date: 2026-07-22

## Context

The original content facade handled articles, projects, taxonomy, and search,
and constructed its own infrastructure dependency. Some interface elements also
looked actionable or data-backed while using placeholders or decorative values.

## Decision

Split application behavior into article, project, and discovery services. Give
each service only the repository capabilities it needs and construct concrete
dependencies in a composition root. Treat information honesty, visible status,
recovery, keyboard access, and touch access as product-level interaction
contracts.

## Consequences

- Each service has one reason to change and infrastructure remains replaceable.
- Routes consume use-case-oriented services rather than storage details.
- Catalog validation rejects stale category counts and missing project/article links.
- Project statistics describe catalog state, placeholder contact links are not clickable,
  and filter/search states provide explicit feedback and recovery.
- A small amount of additional code is accepted to make dependency direction and
  user expectations testable.
