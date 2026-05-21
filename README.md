# Civic Logos Site

Phase 1 landing site for Civic Logos, built with Next.js and designed to communicate the project's core thesis:

- Civic Logos is a public reasoning platform for living ideas.
- The platform is built around ideas, not posts.
- Phase 1 is a clear public launch page, not the full product.

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

## Phase 1 notes

The current site includes:

- mission-led homepage copy
- concise manifesto section
- core distinctions for the platform
- healthcare issue room with an initial working topic card
- prototype contribution loop on the healthcare administrative simplification topic card
- governance room with a first card on subsidiarity and authority allocation
- housing room with a first card on abundance and zoning reform
- AI and civilizational impact room with its first working topic card
- institutional trust room with a first card on public review stakes
- seeded room library for governance, housing, AI/labor, and institutional trust
- early-access contact calls to action

The next likely upgrade is wiring a real email signup provider such as Buttondown, Formspree, or ConvertKit.

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

For Microsoft 365 from GoDaddy, the default SMTP host is typically `smtp.office365.com`.

## AI contribution intake

The healthcare administrative simplification topic card now supports a prototype
contribution loop backed by `/api/contributions`.

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
