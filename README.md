# sharkdingo 的知识花园

A cloud-native personal portfolio, writing system, and algorithm notebook. The
public reading experience and the authenticated Studio share one D1 content
graph, so published changes become the source of truth for pages, search, RSS,
and the sitemap.

## Product surfaces

| Route | Purpose |
| --- | --- |
| `/` | Portfolio home and daily curation |
| `/writing` | Article archive |
| `/writing/[slug]` | Immersive article reading |
| `/problems` | Algorithm notebook |
| `/projects` | Project portfolio |
| `/explore` | Cross-content discovery |
| `/play` | Content-backed knowledge constellation |
| `/studio` | Owner-only content control plane |

Studio supports article drafts, scheduled publishing, revision recovery,
projects, algorithm solutions, and D1-backed site copy/theme settings. Public
routes never read draft or archived content.

## Architecture

The application is a server-first modular monolith deployed as a stateless
Cloudflare Worker:

```text
Routes and React components
        ↓
Application services
        ↓
Domain models and repository ports
        ↑
D1 repository adapters
        ↑
Composition root
```

See [`docs/architecture.md`](docs/architecture.md) and the ADRs in
[`docs/adr`](docs/adr) for the design decisions.

## Prerequisites

- Node.js `>=22.13.0`
- npm
- Windows 11, macOS, or Linux

No Cloudflare account is required for local development. Wrangler and the
Cloudflare Vite plugin provide a persistent local D1 simulation.

## Local development

```bash
npm ci
npm run dev
```

The first `npm run dev` automatically applies every pending migration, creates
the local D1 database, and then starts the application. Data persists under
`.wrangler/state/v3`.

Useful checks:

```bash
npm run lint
npm test
npm run db:status
```

`npm test` performs a production Vinext build, validates the Worker artifact,
executes all Drizzle migrations in SQLite, and runs the architecture and
interaction contracts.

For Studio access, Windows/PowerShell commands, local backups, resets, mobile
testing, and the complete schema workflow, see
[`docs/local-development.md`](docs/local-development.md).

## Data and deployment

- Drizzle schema: `db/schema.ts`
- Versioned migrations: `drizzle/`
- Hosting identity and binding names: `.openai/hosting.json`
- Production build validation: `scripts/build.mjs`

The `DB` D1 binding is required. Authentication is supplied by the hosting
platform. Studio authorization reads the comma-separated
`STUDIO_EDITOR_EMAILS` runtime value; editor identities are never committed to
source or stored in content migrations.

Do not commit local environment files, runtime caches, build output, or
credentials. They are excluded by `.gitignore`.

Local and production D1 are deliberately separate. A local reset cannot affect
production, and a local migration command cannot select a remote database.

## Sites lifecycle

The Sites lifecycle installs the locked dependencies before returning its
checkout. Source is edited under `app/`; a checkpoint builds, validates, saves,
and deploys one immutable source version. This project does not use
`wrangler.jsonc`.

`install:ci` is the Linux-based Sites lifecycle installer. It performs a single
bounded `npm ci`, validates a writable
project-scoped environment, verifies the locked Vinext tarball, limits
concurrency, and terminates a stalled install. Ordinary contributors should use
the cross-platform `npm ci`. `build` uses a cross-platform bounded Vinext build
and then validates the deployable Worker artifact. Runtime caches are stored
under `.sites-runtime/` and are ignored by Git.

## Authentication and authorization

The hosting platform injects the authenticated user's email in
`oai-authenticated-user-email`. A percent-encoded full name may also be provided
through:

- `oai-authenticated-user-full-name`
- `oai-authenticated-user-full-name-encoding: percent-encoded-utf-8`

`app/chatgpt-auth.ts` wraps those headers and the platform-owned sign-in,
sign-out, and callback paths. Studio routes require identity and then check the
email against `STUDIO_EDITOR_EMAILS`. Every Studio write endpoint performs the
same authorization check on the server. Keep that value in hosted runtime
configuration, never in `.env` files committed to Git.

SIWC establishes identity; hosting access policy and the application allowlist
remain responsible for access control.

Local Studio uses an explicit `.dev.vars` opt-in and a loopback-only identity
shortcut because the hosted sign-in endpoints are unavailable on localhost.
Authorization still checks the same `STUDIO_EDITOR_EMAILS` allowlist.

## Diagnostic commands

- `npm run install:ci`: one bounded lockfile install
- `npm run dev`: start the Vite/Vinext development server
- `npm run build`: build and validate the Sites artifact
- `npm run start`: preview the built Worker in the Cloudflare-compatible runtime
- `npm test`: build and run migration, architecture, and interaction contracts
- `npm run validate:artifact`: recheck an existing Worker artifact
- `npm run db:generate`: generate a migration after a schema change
- `npm run db:migrate`: apply pending migrations to local D1
- `npm run db:status`: list pending local migrations
- `npm run db:backup`: export local D1 into an ignored backup directory
- `npm run db:reset -- --yes`: rebuild only the local D1 database

Controlled timeout overrides are available through
`SITES_INSTALL_TIMEOUT`, `SITES_INSTALL_KILL_AFTER`, `SITES_BUILD_TIMEOUT`, and
`SITES_BUILD_KILL_AFTER`. A timeout fails the operation and does not retry an
unchanged command.

## Learn more

- [Vinext documentation](https://github.com/cloudflare/vinext)
- [Drizzle D1 guide](https://orm.drizzle.team/docs/get-started/d1-new)
