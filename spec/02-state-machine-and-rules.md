# Contribution State Machine and Record Rules

Status: draft protocol artifact for Civic Logos Reasoning Ledger v0.1.

## Contribution States

Canonical states:

- `draft`
- `submitted`
- `classified`
- `ai_reviewed`
- `needs_human_review`
- `accepted`
- `incorporated`
- `rejected`
- `archived`
- `superseded`

Implementations may expose legacy labels such as `pending` or `needs review`, but protocol conformance must map them to canonical states before evaluating changed-record counts.

## Allowed Transitions

| From | To | Requirement |
| --- | --- | --- |
| `draft` | `submitted` | Contributor or maintainer submits the record. |
| `submitted` | `classified` | Lane and preliminary attachment target are assigned. |
| `classified` | `ai_reviewed` | One or more `AIReaderNote` records are attached, or AI unavailability is recorded. |
| `ai_reviewed` | `needs_human_review` | Human review is required before placement, rejection, or incorporation. |
| `needs_human_review` | `accepted` | Human reviewer accepts the record without changing synthesis. |
| `needs_human_review` | `incorporated` | Human reviewer incorporates the record into one or more public objects. |
| `needs_human_review` | `rejected` | Human reviewer rejects the record with a public reason. |
| `accepted` | `superseded` | A later record changes how this accepted record is interpreted. |
| `incorporated` | `superseded` | A later revision replaces or corrects the incorporated effect. |
| any non-terminal state | `archived` | Record is preserved but removed from active review. |

## Changed-Record Rules

- `draft`, `submitted`, `classified`, `ai_reviewed`, `needs_human_review`, and implementation aliases such as `pending` cannot count as changed-card records.
- `accepted` records do not count as changed-card records unless a conforming implementation explicitly models `accepted` as an incorporation event with `actual_card_change: true` and a `RevisionEvent`. The preferred state for that case is `incorporated`.
- `incorporated` records must explicitly say whether `actual_card_change` is `true` or `false`.
- `actual_card_change: true` requires a `RevisionEvent`.
- `actual_card_change: false` requires an explanation in the `HumanReviewDecision`.
- `RevisionEvent` requires both `previous_synthesis_snapshot_id` and `new_synthesis_snapshot_id`.
- `AIReaderNote` cannot directly mutate public synthesis.

## AttachmentTarget Types

Allowed `AttachmentTarget.target_type` values:

- `claim`
- `evidence`
- `objection`
- `assumption`
- `open_question`
- `synthesis`
- `scorecard`
- `metric`
- `stakeholder_map`
- `revision_history`
- `none`

## AIReaderNote Transparency Fields

Required fields:

- `model_provider`
- `model_name`
- `model_version_if_available`
- `reader_role`
- `prompt_category`
- `input_scope`
- `used_external_sources`
- `source_list`
- `output_summary`
- `proposed_lane`
- `proposed_attachment_targets`
- `proposed_review_status`
- `confidence`
- `limitations`
- `human_decision_status`

## HumanReviewDecision Fields

Required fields:

- `reviewer_id` or `reviewer_label`
- `reviewer_disclosure_note`
- `reviewer_conflict_note`
- `decision_status`
- `accepted_lane`
- `accepted_attachment_targets`
- `actual_card_change`
- `public_record_note`
- `decision_reason`
- `revision_event_id` if applicable
- `created_at`

Reviewer conflict information should be available through the linked `ActorRecord` or through a public reviewer disclosure note.

## RevisionEvent Fields

Required fields:

- `revision_id`
- `topic_id`
- `triggering_record_id`
- `previous_synthesis_snapshot_id`
- `new_synthesis_snapshot_id`
- `changed_fields`
- `reason_for_change`
- `reviewer_note`
- `review_decision_id`
- `origin`
- `created_at`
- `content_hash`

The event must also preserve what remains unresolved after revision, either directly in `unresolved_after_revision` or by linking to visible `OpenQuestionRecord` objects.

## Additive Correction Rule

Rollback and correction are additive. A later correction creates a new contribution, review decision, synthesis snapshot, and revision event. It must not silently overwrite or delete the original public-record event.
