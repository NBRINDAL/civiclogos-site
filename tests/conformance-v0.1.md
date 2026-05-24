# Reasoning Ledger Conformance Tests v0.1

These tests define what a Civic Logos Reasoning Ledger implementation must prove before it can claim protocol conformance.

## 1. State-Machine Tests

- A `draft` contribution can become `submitted`.
- A `submitted` contribution can become `classified`.
- A `classified` contribution can become `ai_reviewed`.
- An `ai_reviewed` contribution can become `needs_human_review`.
- A `needs_human_review` contribution can become `accepted`, `incorporated`, or `rejected`.
- A `submitted`, `classified`, `ai_reviewed`, `needs_human_review`, or legacy `pending` record must not count as a changed-card record.
- An `incorporated` record must include a `HumanReviewDecision` with `actual_card_change`.

## 2. Revision-Event Integrity Tests

For every `RevisionEvent`, an implementation must resolve:

- `triggering_record_id` to a `ContributionRecord`
- `review_decision_id` to a `HumanReviewDecision`
- `previous_synthesis_snapshot_id` to a `SynthesisSnapshot`
- `new_synthesis_snapshot_id` to a later `SynthesisSnapshot`
- `changed_fields` to one or more public fields
- `reason_for_change` to a public explanation
- `unresolved_after_revision` to a visible unresolved-state list

If `actual_card_change` is `true`, `revision_event_id` must exist and resolve.

## 3. AI-Reader Transparency Tests

Every `AIReaderNote` must disclose:

- provider and model information
- reader role
- prompt category
- input scope
- whether external sources were used
- source list
- output summary
- proposed lane
- proposed attachment targets
- proposed review status
- confidence
- limitations
- human decision status

An `AIReaderNote` must never directly change a public synthesis snapshot.

## 4. Evidence-Object Validation Tests

- URL evidence must include a valid URL.
- Document evidence must include a document identifier.
- Restricted evidence must disclose that public access is restricted.
- Evidence objects may support review, but they do not become conclusions by themselves.

## 5. Public/Private Field Boundary Tests

Public contribution records may expose:

- title
- body
- lane
- origin label
- date/time
- public source label/link
- attachment targets
- AI-reader summaries
- human review notes

Public contribution records must not expose private email addresses or private follow-up metadata. If a contribution is founder-maintainer, founder-submitted, AI-origin, or prototype data, that origin must remain visible and must not count as outside public uptake.

## 6. Reviewer Disclosure Tests

Every `HumanReviewDecision` must expose who reviewed the record at a public-label level and must include:

- why that reviewer or maintainer handled the record
- any relevant conflict, tie, or limitation
- `none disclosed` or an equivalent explicit statement when no conflict is known

## 7. Fixture Test

The canonical healthcare fixture must satisfy the north-star invariant:

- previous synthesis is reconstructable from `snapshot:healthcare-topic-001:v0.1`
- triggering pressure is reconstructable from `contribution:healthcare-topic-001:founder-synthesis-narrowing`
- AI-reader suggestions are reconstructable from the two `AIReaderNote` records
- human decision is reconstructable from `review:healthcare-topic-001:founder-narrowing`
- public object changed through `topic.current_synthesis` and related snapshot pointers
- new synthesis is reconstructable from `snapshot:healthcare-topic-001:v0.2`
- reason for change is reconstructable from the `RevisionEvent`
- unresolved remainder is reconstructable from `unresolved_after_revision`

## 8. Appeal and Unresolved-State Tests

- An `AppealRecord` must resolve its `appealed_object_id` to an existing public ledger object.
- An appeal may challenge a review decision, revision, synthesis snapshot, claim, evidence object, contribution, or metric, but it cannot silently overwrite the challenged object.
- If an appeal changes synthesis, it must link to a new `HumanReviewDecision` and `RevisionEvent`.
- AI-reader notes attached to appeals remain advisory and cannot resolve the appeal by themselves.
- Rejected or unresolved appeals should remain inspectable when they are part of the public record.
- A completed review cycle may leave a claim unresolved; unresolved pressure must remain visible through `unresolved_after_revision` or `OpenQuestionRecord` attachments.
