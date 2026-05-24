# Civic Logos Reasoning Ledger Protocol v0.1 Charter

Status: draft protocol artifact for public review.

The Civic Logos Reasoning Ledger is an open protocol for public claims, contributions, AI-reader notes, human review decisions, attachment targets, and revision history.

Civic Logos is the live product and public prototype. The Reasoning Ledger is the reusable open-source layer that can be implemented by other civic-tech projects, newsrooms, public comment systems, research groups, and institutions without adopting the whole Civic Logos product.

## Purpose

The protocol exists to preserve structured public reasoning for claims that should not disappear into feeds. It gives a public claim a durable record of:

- what was claimed
- what evidence was attached
- what objections were raised
- what assumptions remained exposed
- what AI readers suggested
- what human reviewers decided
- what changed, why it changed, and what remains unresolved

## North-Star Invariant

Given any `RevisionEvent`, a third party must be able to reconstruct:

- what the previous public record said
- what contribution or review pressure triggered the change
- what AI readers suggested
- what a human reviewer decided
- what public object changed
- what the new public record says
- why the change happened
- what remains unresolved

## Authority Rule

AI assists the record. Human review moves the record.

AI systems may classify, summarize, compare, challenge, propose attachment targets, estimate likely impact, and state limitations. AI output cannot directly mutate public synthesis, mark a contribution incorporated, or create a `RevisionEvent` without a `HumanReviewDecision`.

## Public Record Change Rule

No public synthesis can change without:

- a triggering `ContributionRecord` or review pressure record
- one or more inspectable `AIReaderNote` objects, unless AI review was unavailable and that absence is recorded
- a `HumanReviewDecision`
- before and after `SynthesisSnapshot` records
- a `RevisionEvent` linking the triggering record, review decision, changed fields, reason for change, and unresolved remainder

## Separation Rule

Claims, evidence, assumptions, objections, open questions, AI notes, human decisions, funding disclosures, metrics, and revisions must remain architecturally separate. Conflating them invites legitimacy laundering.

## Unresolved-State Rule

Unresolved is a valid civic state. A claim can remain live, contested, and useful without pretending that the ledger has settled it.

## Funding Rule

Money may fund examination capacity, maintenance, review labor, documentation, and synthesis work. Money must not buy favorable conclusions, quiet review outcomes, legitimacy, ranking, or authority.

## Non-Goals

The protocol does not define a popularity system, advertising system, paid ranking mechanism, or AI oracle. It does not require every implementation to use the Civic Logos UI.
