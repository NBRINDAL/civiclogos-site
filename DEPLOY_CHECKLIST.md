# Civic Logos V2 Deploy Checklist

Use this checklist for the controlled V2 rollout where the root chat shell at `/`
is the public entry point and `/about` preserves the older homepage.

## 1. Pre-deploy branch checks

- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] `npm run protocol:check`
- [ ] `npm run candidate:flow:check`
- [ ] Confirm the root chat shell is live in the branch at `/`
- [ ] Confirm `/about` still preserves the longer homepage
- [ ] Confirm the public trust boundary still holds:
  - AI may answer from the public ledger
  - AI may structure internal `CandidateRecord`s
  - AI may not create public `ContributionRecord`s directly
  - AI may not create `RevisionEvent`s
  - AI may not change synthesis

## 2. Required environment configuration

Set the following per environment before expecting full public candidate intake:

- [ ] `NEXT_PUBLIC_SITE_URL`
- [ ] `CIVIC_LOGOS_MAINTAINER_KEY` or `MAINTAINER_REVIEW_KEY`
- [ ] `DATABASE_URL` or `POSTGRES_URL`
- [ ] Optional database alternates if needed:
  - `POSTGRES_PRISMA_URL`
  - `POSTGRES_URL_NON_POOLING`
- [ ] `CIVIC_LOGOS_ALLOWED_ORIGINS` includes all first-party write origins that should be allowed
- [ ] `OPENAI_API_KEY` and `OPENAI_MODEL` if OpenAI-backed ask/candidate AI should be active
- [ ] `ANTHROPIC_API_KEY` and `ANTHROPIC_MODEL` if Anthropic-backed ask/candidate AI should be active
- [ ] SMTP/contact env vars if `/api/contact` should be active

Preview notes:

- [ ] Preview `NEXT_PUBLIC_SITE_URL` points to the preview HTTPS URL
- [ ] Preview writes are covered by `CIVIC_LOGOS_ALLOWED_ORIGINS` if preview should support writes
- [ ] Preview has durable candidate/topic-chat storage if public candidate intake should be enabled there

## 3. Public-host durable-storage guard

These must remain true on any public non-local host:

- [ ] If candidate/topic-chat storage is not durable, `/` and `/ask` show:
  - `Prototype read-only mode: durable storage is not configured`
- [ ] Read-only ask still works in that mode
- [ ] Contribution-style ask is blocked in that mode
- [ ] No prototype candidate records are written on a public host
- [ ] No prototype topic-chat messages are written on a public host

## 4. Preview HTTPS smoke test

Run this after the preview deployment URL exists.

- [ ] `npm run https:smoke:check -- https://your-preview-url`

Routes:

- [ ] `/`
- [ ] `/ask`
- [ ] `/about`
- [ ] `/ledger`
- [ ] `/demo`
- [ ] `/healthcare/topic-001?view=ledger`
- [ ] `/review/contributions` shows the lock screen in a fresh session

Behavior:

- [ ] `/` renders the V2 main chat shell
- [ ] `/ask` renders the same shared shell
- [ ] `/about` renders the old homepage content
- [ ] `/ledger` shows V2 candidate-intake status
- [ ] `/demo` shows the healthcare V2 example
- [ ] Read-only ask creates no `CandidateRecord`
- [ ] Contribution-style ask creates a `CandidateRecord` only if durable storage is configured
- [ ] No public `ContributionRecord` is created without maintainer promotion
- [ ] No `RevisionEvent` is created by `/` or `/ask`
- [ ] Synthesis does not change
- [ ] Public review console remains gated

Maintainer checks:

- [ ] Unlock `/review/contributions` with the maintainer key
- [ ] Confirm the pre-ledger candidate queue is visible
- [ ] Confirm promotion still requires explicit maintainer action
- [ ] Confirm candidate provenance survives promotion

## 5. Production deploy

Proceed only if the preview checklist passes.

- [ ] Deploy to production
- [ ] Confirm `civiclogos.com/` serves the V2 root chat shell
- [ ] Confirm `civiclogos.com/about` serves the preserved long homepage

## 6. Production HTTPS smoke test

Repeat the same checks on production:

- [ ] `npm run https:smoke:check -- https://civiclogos.com`

- [ ] `/`
- [ ] `/ask`
- [ ] `/about`
- [ ] `/ledger`
- [ ] `/demo`
- [ ] `/healthcare/topic-001?view=ledger`
- [ ] `/review/contributions` lock screen
- [ ] Read-only ask creates no `CandidateRecord`
- [ ] Contribution ask creates a `CandidateRecord` only if durable storage is configured
- [ ] No public `ContributionRecord` without promotion
- [ ] No `RevisionEvent` from `/` or `/ask`
- [ ] No synthesis change
- [ ] Public review console remains gated

## 7. Maintainer verification endpoint

After unlocking the maintainer session:

- [ ] `GET /api/storage/status`
- [ ] Confirm `candidateIntake.mode === "database"` and `topicChat.mode === "database"` before public candidate intake is considered fully enabled
- [ ] If those modes are not `database`, confirm `ask.prototypeReadOnlyMode === true` on the public host
