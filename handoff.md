# Civic Logos v2 Handoff

Last updated: May 25, 2026

## Purpose

This handoff captures the current Civic Logos state and creates a clean runway
for v2 ideas without confusing prototype examples, founder-maintainer records,
or outside public participation.

Civic Logos is now best understood as two connected things:

- A live public reasoning prototype for durable topic cards.
- The Civic Logos Reasoning Ledger protocol: claims, contributions, AI-reader
  notes, human review decisions, attachment targets, synthesis snapshots, and
  revision events.

The v2 task is not to add more rooms casually. The v2 task is to make the first
outside contribution easy, legible, reviewable, and meaningful.

## Current Shipped State

- The healthcare room remains the strongest living idea object.
- The first healthcare topic is `Administrative Simplification and AI-Assisted Triage`.
- A founder-maintainer public-record revision has been completed through the
  ledger flow.
- The live healthcare synthesis now comes from a revision event, not a silent
  copy edit.
- The protocol fixture and live healthcare export agree on the before/after
  synthesis state.
- The `/challenge` page now explains how a stranger can make one useful first
  contribution.
- The `/ledger` page now explains the first public-record audit milestone.
- Outside public submissions remain `0`.

## Recent Milestones

- `68b3258` - Built the first-contributor runway on `/challenge`.
- `cd3bca1` - Removed low-signal referral source options from contribution forms.
- `6b51d39` - Audited healthcare public-record revision consistency.
- `94fa107` - Made the healthcare synthesis narrowing a live ledger revision.
- `98d559a` - Set the site brand symbol to 69px.

## Product Invariants

- AI assists the record. Human review moves the record.
- Do not create fake public activity.
- Do not let founder-maintainer work count as outside public participation.
- Do not silently rewrite synthesis copy.
- Do not add another synthesis revision until there is a real reason to move the
  public record again.
- Do not expand rooms casually.
- Do not pre-seed R-gravity conclusions into code or synthesis.
- Keep provenance, score transparency, review status, and unresolved items
  visible.

## Current Public Counts To Preserve

For healthcare topic `topic-001`, the current expected public record shape is:

- Visible records: `7`
- Pending review: `2`
- Changed-card records: `1`
- Founder-maintainer revisions: `1`
- Founder-submitted records: `1`
- Outside public submissions: `0`
- Prototype examples: `5`

These numbers should change only through real contribution/review activity or
intentional fixture/prototype edits.

## First Founder-Maintainer Revision

The first live revision proves that the ledger loop can move a public card while
preserving provenance.

Confirmed links:

- ContributionRecord:
  `contribution:healthcare-topic-001:founder-synthesis-narrowing`
- HumanReviewDecision:
  `review:healthcare-topic-001:founder-narrowing`
- RevisionEvent:
  `revision:healthcare-topic-001:founder-narrowing-v0-2`
- Previous SynthesisSnapshot:
  `snapshot:healthcare-topic-001:v0.1`
- New SynthesisSnapshot:
  `snapshot:healthcare-topic-001:v0.2`

The current synthesis is:

> Administrative simplification and AI-assisted triage remain plausible
> healthcare reform levers, but the card should not treat net savings, access
> gains, or clinician-time recovery as established until administrative-cost
> baselines, transition costs, savings-capture rules, human-escalation
> thresholds, and provider-time impacts are attached to evidence.

## v2 North Star

Make Civic Logos feel like a working public reasoning platform, not a landing
page with prototype claims.

The first v2 success condition is simple:

> A stranger arrives, understands the live healthcare card, submits one useful
> contribution, and can later see how the ledger handled it.

## New v2 Ideas From Nick

Use this section as the parking lot for new product ideas before implementation.
Each idea should name what public-record problem it solves.

- Idea:
  Problem solved:
  Risk:
  Smallest shippable test:

- Idea:
  Problem solved:
  Risk:
  Smallest shippable test:

- Idea:
  Problem solved:
  Risk:
  Smallest shippable test:

## Strong v2 Directions

### 1. First Outside Contributor Conversion

Goal: make it obvious how to make one useful contribution.

Shippable moves:

- Improve the `/challenge` path from read -> choose lane -> draft -> submit.
- Keep five first-contribution examples visible: strong objection, evidence
  source, correction, implementation concern, economic assumption challenge.
- Make the next milestone explicit: first outside contribution.
- After the first outside contribution lands, preserve `outside public
  submission` provenance and do not conflate it with founder activity.

### 2. Review Cockpit

Goal: make maintainer review feel like a durable workspace rather than a form.

Shippable moves:

- Keep reviewer chat attached indefinitely to a contribution.
- Let reviewers add docket evidence without turning it into contributor evidence.
- Let AI synthesize reviewer discussion into a draft review note.
- Keep the boundary visible: reviewer chat does not change the public record by
  itself.

### 3. Evidence Pipeline

Goal: make uploaded evidence readable to humans and AIs.

Shippable moves:

- Keep hosted papers viewable from review pages.
- Preserve extraction status separately from AI evidence access.
- Support pasted accessible paper text when PDF extraction fails.
- Make document-backed records visibly distinct from source-linked records.

### 4. Protocol Reference Implementation

Goal: move from protocol fixture to reusable open-source ledger layer.

Shippable moves:

- Keep JSON schemas aligned with live export objects.
- Add conformance cases for bidirectional review/revision links.
- Add a minimal TypeScript reference package or module boundary.
- Document how a third party validates a `RevisionEvent`.

### 5. Public Auditability

Goal: make every public change reconstructable.

Every synthesis-changing event should answer:

- What did the previous public record say?
- What triggered pressure?
- What did AI readers suggest?
- What did human review decide?
- What changed?
- Why did it change?
- What remains unresolved?

### 6. Neutral Physics Path

Goal: keep Physics Foundations protocol-safe.

Current rule:

- Standard quantum theory, general relativity, and Planck units form the neutral
  baseline.
- R-gravity or other founder-origin frameworks enter only through website
  contributions, AI-assisted review, human review, attachment targets, and
  visible revision history.
- Do not pre-seed R-gravity conclusions in code or synthesis.

### 7. Institutional Pilot Path

Goal: make institutions understand the Public Review Stake model without adding
monetization complexity.

Shippable moves:

- Keep institutional inquiry paths focused on review capacity and public
  legitimacy boundaries.
- Do not add Stripe or paid legitimacy mechanics.
- Explain that money can fund examination, not conclusions.

## Important Files

- `app/challenge/page.tsx` - First-contributor runway.
- `app/ledger/page.tsx` - Protocol anchor and public-record audit.
- `app/lib/canonical-ledger-records.ts` - Canonical live founder-maintainer
  healthcare revision.
- `app/lib/reasoning-ledger-export.ts` - Protocol-shaped healthcare ledger
  export.
- `app/lib/contribution-counts.ts` - Public count summary logic.
- `app/lib/contribution-impact.ts` - Changed-card guardrail logic.
- `examples/healthcare-topic-001-founder-maintainer-revision.fixture.json` -
  Canonical healthcare fixture.
- `schema/` - JSON schemas.
- `spec/` - Protocol docs.
- `tests/` - Conformance cases.

## Verification Commands

Run before shipping meaningful changes:

```bash
npm run lint
npm run protocol:check
npm run build
```

For public-record work, also sanity-check:

- `/`
- `/challenge`
- `/ledger`
- `/healthcare/topic-001?view=ledger#contribution-record`
- `/api/ledger/healthcare/topic-001`

## Do Not Do Next

- Do not add another healthcare synthesis revision just to show movement.
- Do not add fake outside submissions.
- Do not relabel founder-maintainer or founder-submitted records as public
  uptake.
- Do not expand the room library unless public intake/review justifies it.
- Do not bury unresolved items after a revision.

## Best Next Move

The most useful next product milestone is the first real outside contribution.

Everything else in v2 should support that moment:

- The stranger knows what to submit.
- The record stores it with the right origin.
- AI readers help classify it.
- Human review decides.
- The public card either changes with a revision trace or preserves the pressure
  as unresolved.
