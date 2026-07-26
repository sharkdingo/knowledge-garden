# ADR 001: Put content behind a repository boundary

- Status: Accepted
- Date: 2026-07-22

## Context

The initial implementation imported static arrays directly into routes. That is
simple, but couples page composition to the current persistence format and makes
a future Markdown, database, or CMS migration unnecessarily invasive.

## Decision

Routes obtain content through focused article, project, and discovery services.
The services depend on small domain-level repository ports. A composition root
selects the current validated static adapter.

## Consequences

- Routes and components no longer know where content is stored.
- Catalog validation fails the build for duplicate slugs, invalid dates,
  missing sections, or malformed projects.
- A future adapter can be introduced without redesigning the UI.
- There is a small amount of additional structure, accepted because it protects
  the most likely future migration boundary.
