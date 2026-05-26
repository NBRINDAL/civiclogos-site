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

- chat-first root shell at `/`
- preserved long-form homepage copy at `/about`
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

## V2: Chat-first pre-ledger candidate intake

V2 promotes the chat workspace to the main product entry point.

- `/` is the main V2 chat shell.
- `/ask` is an equivalent direct route to the same shared chat shell.
- `/about` preserves the older long-form homepage and manifesto surface.
- The website remains the public audit surface; the chat is the interaction surface.
- `/ask` is a pre-ledger intake surface, not a public-write surface.
- A user message can become an internal `CandidateRecord`.
- AI may help structure that candidate, but it does not write directly into the
  public ledger.
- A candidate becomes a normal public `ContributionRecord` only after reviewer
  promotion from the maintainer queue.
- Later `RevisionEvent`s still require the existing public review path.
- There are no automatic public ledger writes from the V2 chat intake.
- Read-only ask intents can answer from the live healthcare ledger without
  creating a candidate.

If Civic Logos is running on a public non-local host and durable candidate/topic
chat storage is not available, the main chat shell automatically enters:

- `Prototype read-only mode: durable storage is not configured`

In that mode:

- read-only ledger answers still work
- candidate submission is disabled
- no public candidate records or topic chat sessions are silently written to
  prototype JSON/temp storage

Use the end-to-end check below to verify the trust boundary and promotion path:

```bash
npm run candidate:flow:check
```

The scripted check verifies that `/ask` does not change public counts, does not
create `RevisionEvent`s, and preserves candidate provenance when a reviewer
promotes the candidate into the public contribution queue.

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

It returns whether the intake, contribution, candidate-intake, and topic-chat
layers are running in `database`, `fallback`, or `prototype` mode, plus whether
public `/` and `/ask` candidate intake is currently eligible to run. The
endpoint is intentionally maintainer-gated because it exposes operational
storage metadata.

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

## Deploy readiness

The V2 public update is ready to ship only when the chat shell can preserve its
trust boundary on the deployed host.

### Required production environment variables

- `NEXT_PUBLIC_SITE_URL`
- `CIVIC_LOGOS_MAINTAINER_KEY` or `MAINTAINER_REVIEW_KEY`
- `DATABASE_URL` or `POSTGRES_URL`
- optionally `POSTGRES_PRISMA_URL`
- optionally `POSTGRES_URL_NON_POOLING`
- optionally `CIVIC_LOGOS_ALLOWED_ORIGINS` if writes can originate from more
  than one first-party host
- `OPENAI_API_KEY` and `OPENAI_MODEL` if OpenAI-backed candidate structuring or
  readers should be active
- `ANTHROPIC_API_KEY` and `ANTHROPIC_MODEL` if Anthropic-backed candidate
  structuring or readers should be active
- SMTP/contact variables if `/api/contact` should be live

Preview deployments should either:

- use the same durable database-backed candidate/topic-chat storage as production,
  or
- intentionally run in prototype read-only mode, where read-only ledger answers
  remain available but public candidate submission is disabled

### Storage and review checklist

- public `/` and `/ask` candidate intake should run only when both
  `CandidateRecord` storage and topic-chat storage are in `database` mode
- if durable ask storage is unavailable on a public host, the chat shell should
  show the prototype read-only notice and refuse candidate submission
- `/review/contributions` must remain maintainer-gated
- reviewer promotion is still required before any public `ContributionRecord`
  exists
- `RevisionEvent`s still require the existing human review path

### Host and deployment checklist

- set the production/public URL correctly in `NEXT_PUBLIC_SITE_URL`
- set the preview URL correctly in `NEXT_PUBLIC_SITE_URL` for preview deployments
- configure the Vercel project or equivalent host with the production database
  env vars before enabling public candidate intake
- add preview and production first-party write origins to
  `CIVIC_LOGOS_ALLOWED_ORIGINS` when both environments need write access
- verify the host serves the root V2 shell at `/`
- verify `/ask` resolves to the same shared shell
- verify `/about` still exposes the longer homepage narrative

### Smoke test commands

Run these locally before deploying:

```bash
npm run lint
npm run build
npm run protocol:check
npm run candidate:flow:check
```

Then smoke test the deployed HTTPS URL:

- `/` renders as the main chat shell
- `/ask` renders the same shared shell
- `/about` renders the preserved long-form homepage
- `/ledger` shows V2 candidate-intake status
- `/demo` shows the V2 healthcare example
- `/healthcare/topic-001?view=ledger` renders the public ledger slice
- `/review/contributions` shows the maintainer lock screen for a fresh public session
- read-only ask creates no `CandidateRecord`
- contribution-style ask creates a `CandidateRecord` only when durable storage is configured
- if durable storage is missing on a public host, `/` and `/ask` remain read-only and do not create prototype candidate/topic-chat writes
- no public `ContributionRecord` exists until maintainer promotion
- no `RevisionEvent` is created by `/` or `/ask`
- synthesis does not change

For the step-by-step release checklist, including preview and production HTTPS
smoke passes, see [DEPLOY_CHECKLIST.md](DEPLOY_CHECKLIST.md).
