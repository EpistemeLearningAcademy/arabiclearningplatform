# Greenfield Schools Platform

Greenfield is a multi-school management and learning platform foundation. A School is the organisation; Campuses are locations inside that school. The repository is an npm workspaces monorepo with a Next.js web/BFF, Express API, and Prisma/PostgreSQL database package.

## Repository layout

- `apps/web` — Next.js browser app and same-origin BFF.
- `apps/api` — Express API, authentication, authorization, and the first academic API slice.
- `packages/database` — Prisma schema, migrations, generated client, and database adapter.
- `packages/config` — shared TypeScript configuration.
- `packages/types`, `packages/ui` — reserved shared packages; currently minimal.
- `docs` — authorization policy, backend notes, and frontend API contract.

## Requirements and setup

Use Node.js 24+, npm 11+, Git, and a local PostgreSQL instance. From the repository root:

```powershell
npm install
Copy-Item .env.example .env
```

Set `DATABASE_URL` in `.env` to your local PostgreSQL database. Keep real passwords and connection strings in ignored `.env`; never commit them. `.env.example` is a placeholder.

## Database

```powershell
npm run db:validate --workspace @greenfield/database
npm run db:generate --workspace @greenfield/database
npx prisma migrate deploy --config packages/database/prisma.config.ts
```

Review pending migration SQL before applying it to a database with existing data. The current implementation pass adds a pending migration for role revocation, teacher assignment history, enrollment history, and school consistency. Do not apply it to production until the migration has been reviewed and tested against a backup or disposable database.

## Development

Run each process from the repository root in a separate terminal:

```powershell
npm run dev --workspace @greenfield/api
npm run dev --workspace @greenfield/web
```

The API listens on `127.0.0.1:4000`; the web app uses `http://127.0.0.1:3000` by default. Configure `GREENFIELD_API_URL` for the web BFF if the API address differs.

## Verification

```powershell
npm run db:validate --workspace @greenfield/database
npx prisma migrate status --config packages/database/prisma.config.ts
npm run build --workspace @greenfield/database
npm run build --workspace @greenfield/api
npx tsc --project apps/web/tsconfig.json --noEmit --incremental false
npm test --workspace @greenfield/api
```

Database-backed tests are opt-in. Use a separate disposable test database and `RUN_DATABASE_TESTS=1`; do not run them against the development database.

## Authorization and frontend contract

Authorization combines an active role assignment, a permission grant, a resource, and scope ancestry resolved from database relations. CampusMembership is organisational context, not a permission grant. The 14 official role identifiers and authorization rules are documented in [`docs/authorization-model.md`](docs/authorization-model.md). The exact currently supported API paths, data shapes, and intentionally missing workflows are in [`docs/frontend-integration-contract.md`](docs/frontend-integration-contract.md).

This is not yet a complete LMS or school-management product. Academic update/delete, results, finance, admissions, transport, content/media, and student/parent portal APIs are not implemented.
