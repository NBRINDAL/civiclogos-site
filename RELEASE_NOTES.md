# Civic Logos V2 Controlled Update

Release candidate status: feature work is frozen for this branch. This update is intended for a controlled public deployment of the V2 chat-first surface without expanding rooms, topic cards, ontology, or the public-record trust boundary.

## What Changed

- `/` is now the main Civic Logos chat workspace.
- `/about` preserves the old long-form homepage.
- `/ask` supports read-only ledger answers and pre-ledger candidate intake.
- Routing is conservative and inspectable for the existing healthcare and Physics Foundations paths.
- Ambiguous or weakly matched inputs become internal candidates needing maintainer routing.
- AI cannot write the public ledger.
- Candidate promotion requires maintainer review.
- `RevisionEvent`s still require the existing public review path.
- Candidate intake is blocked on public hosts unless durable candidate and topic-chat storage are configured.

## Final Deploy Checklist

- [ ] Production database env vars are configured.
- [ ] Maintainer auth is configured with `CIVIC_LOGOS_MAINTAINER_KEY` or `MAINTAINER_REVIEW_KEY`.
- [ ] AI keys are configured, or read-only behavior without AI-backed intake is understood.
- [ ] Candidate storage is durable.
- [ ] Topic-chat storage is durable.
- [ ] `/review/contributions` remains gated.
- [ ] Public hosts cannot write prototype candidate records.
- [ ] Public hosts cannot write prototype topic-chat records.
- [ ] If durable storage is missing on a public host, `/` and `/ask` show prototype read-only mode and block candidate submission.

## Required Local Validation

Run these in order:

```bash
npm run lint
npm run build
npm run protocol:check
npm run candidate:flow:check
```

`candidate:flow:check` must run after `npm run build`, not in parallel.

## HTTPS Preview Smoke Test

Once an authenticated preview deployment is available, run:

```bash
npm run https:smoke:check -- https://your-preview-url
```

Then confirm these routes over HTTPS:

- `/`
- `/ask`
- `/about`
- `/ledger`
- `/demo`
- `/challenge`
- `/healthcare/topic-001?view=ledger`
- `/rooms/physics-foundations/topic-001`
- `/review/contributions` lock screen

Confirm these behaviors over HTTPS:

- read-only healthcare question creates no candidate
- contribution-style healthcare statement creates a candidate only
- symbolic physics input routes to Physics Foundations
- ambiguous input becomes `needs_routing`
- false-positive inputs do not force a route
- no `/ask` path creates a public `ContributionRecord`
- no `/ask` path creates a `RevisionEvent`
- no `/ask` path changes synthesis

For the full operational checklist, see `DEPLOY_CHECKLIST.md`.
