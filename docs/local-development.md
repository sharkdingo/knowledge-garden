# Local development and data operations

Local development runs the same Worker-oriented application against a simulated
Cloudflare D1 database. It does not read or modify the production database.

## First start

Requirements:

- Node.js 22.13 or newer;
- npm;
- Windows 11, macOS, or Linux.

Install and start:

```bash
npm ci
npm run dev
```

`npm run dev` applies every pending migration before Vite starts. The local D1
database is persisted under `.wrangler/state/v3`, so articles and settings
survive restarts. The directory is ignored by Git.

Open:

- site: `http://localhost:5173`;
- readiness: `http://localhost:5173/api/health`;
- local D1 explorer: `http://localhost:5173/cdn-cgi/explorer`.

An `ok/ready` health response means both D1 and the required `profile` record
exist. An `uninitialized` response means migrations have not run.

## Local Studio access

The hosted sign-in endpoints do not exist on localhost. To use Studio locally,
copy the example runtime file and replace its values with one email address:

PowerShell:

```powershell
Copy-Item .dev.vars.example .dev.vars
```

macOS or Linux:

```bash
cp .dev.vars.example .dev.vars
```

The selected email must appear in both `STUDIO_EDITOR_EMAILS` and
`LOCAL_STUDIO_USER_EMAIL`. The local identity shortcut is accepted only when:

- `LOCAL_STUDIO_AUTH=true`;
- the request host is `localhost`, `127.0.0.1`, or `::1`; and
- the email is still authorized by `STUDIO_EDITOR_EMAILS`.

It cannot activate on the deployed domain, even if its environment variables
are misconfigured. `.dev.vars` is ignored by Git.

## Database commands

| Command | Effect |
| --- | --- |
| `npm run db:migrate` | Apply only pending local migrations |
| `npm run db:status` | List pending local migrations |
| `npm run db:backup` | Export local D1 to a timestamped file in `.local-backups/` |
| `npm run db:backup -- path/file.sql` | Export to a chosen path |
| `npm run db:reset -- --yes` | Delete only local D1 state, then rebuild it from migrations |

The migration CLI and Vite share the same persistence directory and D1 binding.
This prevents the common failure where migrations are applied to one local
database while the application opens another.

`db:reset` never targets a remote database. It deletes only
`.wrangler/state/v3/d1`.

## Windows and mobile testing

The ordinary local commands are implemented in Node rather than Bash, so they
work from PowerShell:

```powershell
npm ci
npm run dev
```

To view the visitor experience from a phone on the same network:

```powershell
npm run dev -- --host 0.0.0.0
```

Open `http://<computer-LAN-IP>:5173` on the phone. Local Studio authentication
remains loopback-only by design; authoring should be tested on the computer.

## Build and production-like start

```bash
npm run build
npm start
```

The build is time-bounded, validates the generated Worker entry point, verifies
the hosting manifest, and confirms that migrations were packaged. `npm start`
applies pending local migrations before opening the built application through
the Cloudflare Vite preview runtime.

## Data boundaries

- Local D1: `.wrangler/state/v3`; safe to reset; never uploaded.
- Production D1: managed by the hosting platform; changed only by deployed
  migrations and Studio writes.
- Runtime editor identity: `.dev.vars` locally and hosted secret configuration
  in production.
- Source migrations: schema, navigation, and site configuration only; no sample
  articles, problems, projects, categories, or tags.

Do not copy the production database into local development unless a separate,
explicit data-handling decision has been made. Local backups may contain
private drafts and should not be committed.

## Schema change workflow

1. Change `db/schema.ts`.
2. Run `npm run db:generate -- --name <migration-name>`.
3. Inspect the generated SQL.
4. Run `npm run db:reset -- --yes` to verify a clean installation.
5. Run `npm test`.
6. Deploy the immutable version; the hosting platform applies pending
   migrations to production.
