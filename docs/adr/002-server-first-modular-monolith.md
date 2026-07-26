# ADR 002: Use a server-first modular monolith

- Status: Accepted
- Date: 2026-07-22

## Context

The site needs multiple routes, excellent reading performance, and a small set
of interactive controls. It does not need independent services, durable writes,
or background jobs.

## Decision

Use Next.js App Router with Server Components by default and narrow client
islands for interactive controls. Deploy the application as one Cloudflare
Worker-compatible artifact.

## Consequences

- The initial page payload stays small and content remains indexable.
- Shared UI and content rules evolve atomically.
- Operational complexity stays low.
- Service extraction remains possible later through the repository and
  application boundaries, but is not introduced speculatively.
