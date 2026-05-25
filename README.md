# Civic Logos Reasoning Ledger

Civic Logos is a public reasoning platform for living ideas. This repository now
contains both the live Next.js prototype and the Civic Logos Reasoning Ledger
protocol work:

- `spec/` defines the open protocol for claims, contributions, AI-reader notes,
  human review decisions, attachment targets, and revision events.
- `schema/` contains JSON schemas a third party can implement or validate.
- `examples/` includes the canonical healthcare founder-maintainer synthesis
  narrowing fixture.
- The live site surfaces the same ledger concepts through room/topic cards,
  contribution review, visible revision history, and protocol-shaped exports.

The core invariant is that AI assists the record, while human review moves the
record. A public synthesis should not change without an inspectable review
decision, before/after synthesis snapshots, and a revision event.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Production checks

```bash
npm run lint
npm run build
```

## Deployment

The site is intended to deploy on Vercel and attach to:

- `www.civiclogos.com`
- `civiclogos.com`

## Current prototype notes

The current site includes:

- mission-led homepage copy
- core distinctions for the platform
- healthcare issue room with an initial working topic card
- prototype contribution loop on the healthcare administrative simplification topic card
- live founder-maintainer revision trace on the healthcare topic card
- governance room with a first card on subsidiarity and authority allocation
- housing room with a first card on abundance and zoning reform
- AI and civilizational impact room with its first working topic card
- institutional trust room with a first card on public review stakes
- seeded room library for governance, housing, AI/labor, and institutional trust
- early-access contact calls to action

## Contact form delivery

The live contact form posts to `/api/contact` and sends email through SMTP.

Set these environment variables in Vercel before relying on the form in production:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `CONTACT_TO`
- `CONTACT_FROM`
- `MAINTAINER_NOTIFICATION_TO` (optional override for contribution/review notifications)

For Microsoft 365 from GoDaddy, the default SMTP host is typically `smtp.office365.com`.

## AI contribution intake

The healthcare administrative simplification topic card now supports a prototype
contribution loop backed by `/api/contributions`.

## Contribution persistence backend

The contribution loop now supports a database-backed storage path for the
healthcare reasoning record.

If either of these environment variables is present, Civic Logos will try to use
Postgres for contribution submissions and maintainer review state:

- `DATABASE_URL`
- `POSTGRES_URL`

If no database connection string is configured, or if the database is
temporarily unavailable, the site falls back to the existing local prototype
store so the healthcare room continues to function.

The homepage intake now uses the same database-backed pattern for routed prompts
and provisional draft pages. If a database connection string is configured, weak
fits and routed ideas are stored persistently instead of only in the prototype
runtime file.

Supported Postgres environment variable names:

- `DATABASE_URL`
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`

After unlocking the maintainer review console, maintainers can verify what the
deployed site is actually using with:

- `GET /api/storage/status`

It returns whether the intake and contribution layers are running in
`database`, `fallback`, or `prototype` mode. The endpoint is intentionally
maintainer-gated because it exposes operational storage metadata.

If you want AI-assisted intake on submitted contributions, add one or both of:

- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `ANTHROPIC_API_KEY`
- `ANTHROPIC_MODEL`

Without those keys, contributions still work, but the AI intake layer remains
unavailable.

## Vercel server-side AI setup

The AI providers are called from server routes only. Keys should be added in the
Vercel project settings under `Environment Variables`, not in client code.

Current server-side AI endpoints:

- `GET /api/ai/providers`
  - returns which providers are configured on the server
- `POST /api/ai/providers`
  - runs a live connectivity test from the deployed server to OpenAI and/or Anthropic

Example connectivity test payload:

```json
{
  "provider": "all"
}
```

Recommended Vercel variables:

- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `ANTHROPIC_API_KEY`
- `ANTHROPIC_MODEL`

If those are present, the contribution loop can use both providers as parallel
intake readers for submitted reasoning updates.
