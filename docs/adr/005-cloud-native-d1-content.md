# ADR 005: Cloud-native D1 content source

## Status

Accepted.

## Context

Site identity, navigation, theme values, articles, projects, and about-page
content were previously compiled into TypeScript or CSS. Updating product data
therefore required a source edit and deployment, while presentation components
also carried storage responsibility.

## Decision

Run the application as a stateless edge modular monolith and make D1 the
authoritative store for all structured product content and visual configuration.
Use Drizzle only to define and generate migrations; application reads use
prepared statements inside one D1 repository adapter.

Static image bytes remain immutable deployment assets. Their URLs, descriptions,
and placement are data-driven. R2 is intentionally not bound until authoring or
upload workflows require mutable binary objects.

## Consequences

- Content and presentation now evolve independently.
- Schema, indexes, relationships, and initial production content are reviewable
  and reproducible through migrations.
- Runtime instances stay stateless and horizontally scalable.
- Missing or invalid persistence fails explicitly instead of silently serving
  mock data.
- A future editor or CMS can use the same data model without rewriting pages.
- Operations now include D1 migration health; `/api/health` exposes readiness.
