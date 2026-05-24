# Core Objects

Status: draft protocol artifact for Civic Logos Reasoning Ledger v0.1.

The ledger is composed of inspectable records. Implementations may add fields, but they must preserve the separation between public claims, contributions, AI-reader notes, human review decisions, attachment targets, and revision events.

## RoomRecord

A bounded public reasoning space for a family of related questions.

Minimum fields:

- `room_id`
- `title`
- `description`
- `scope_note`
- `created_at`
- `status`

## TopicRecord

A live issue object inside a room.

Minimum fields:

- `topic_id`
- `room_id`
- `title`
- `current_synthesis_snapshot_id`
- `claim_ids`
- `status`
- `created_at`
- `updated_at`

## ClaimRecord

An inspectable claim attached to a topic. A topic can have multiple claims, and claims can be revised without erasing prior synthesis snapshots.

Minimum fields:

- `claim_id`
- `topic_id`
- `claim_text`
- `current_synthesis_snapshot_id`
- `status`
- `created_at`
- `updated_at`

## SynthesisSnapshot

An immutable public-text snapshot for a topic or claim at a point in time.

Minimum fields:

- `snapshot_id`
- `topic_id`
- `synthesis_text`
- `version_label`
- `created_at`
- `content_hash`
- `unresolved_items`

## ContributionRecord

A submitted contribution that pressures, supports, corrects, or expands the public record.

Minimum fields:

- `contribution_id`
- `topic_id`
- `origin`
- `lane`
- `state`
- `title`
- `body`
- `submitted_at`
- `attachment_targets`
- `ai_reader_note_ids`

## EvidenceObject

A source, document, dataset, citation, or extract used as evidence.

Minimum fields:

- `evidence_id`
- `title`
- `source_type`
- `submitted_at`
- `public_access`
- `summary`

## ObjectionRecord

A structured objection to a claim, synthesis, assumption, metric, or evidence interpretation.

Minimum fields:

- `objection_id`
- `topic_id`
- `claim_id`
- `contribution_id`
- `objection_text`
- `status`
- `created_at`

## AssumptionRecord

An assumption the topic relies on, especially when the assumption affects feasibility, cost, authority, trust, or implementation.

Minimum fields:

- `assumption_id`
- `topic_id`
- `assumption_text`
- `status`
- `created_at`

## OpenQuestionRecord

An unresolved question that remains visible instead of being collapsed into a false conclusion.

Minimum fields:

- `open_question_id`
- `topic_id`
- `question`
- `why_unresolved`
- `created_at`
- `status`

## AIReaderNote

An advisory machine-read attached to a contribution or topic slice. It can propose structure but cannot move the public record.

Minimum fields:

- `ai_reader_note_id`
- `model_provider`
- `model_name`
- `reader_role`
- `input_scope`
- `output_summary`
- `proposed_lane`
- `proposed_attachment_targets`
- `proposed_review_status`
- `confidence`
- `limitations`
- `human_decision_status`

## HumanReviewDecision

A human decision about status, placement, attachment, and whether the public record changes.

Minimum fields:

- `review_decision_id`
- `reviewer_label` or `reviewer_id`
- `decision_status`
- `accepted_lane`
- `accepted_attachment_targets`
- `actual_card_change`
- `public_record_note`
- `decision_reason`
- `created_at`

## AttachmentTarget

The public object or layer a contribution attaches to.

Allowed `target_type` values:

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

## RevisionEvent

An immutable event proving that a public record changed.

Minimum fields:

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
- `unresolved_after_revision`

## MetricScore

A provisional score or metric attached to a topic. A score is not a popularity measure.

Minimum fields:

- `metric_id`
- `topic_id`
- `label`
- `value`
- `scale`
- `basis`
- `confidence`
- `created_at`

## AuditEvent

A log event that records creation, update, review, archival, appeal, supersession, or visibility changes.

Minimum fields:

- `audit_event_id`
- `event_type`
- `actor_id`
- `object_type`
- `object_id`
- `created_at`
- `summary`

## ActorRecord

A public or internal actor identity used for contributor, reviewer, funder, maintainer, or system actions.

Minimum fields:

- `actor_id`
- `actor_type`
- `public_label`
- `disclosure_note`
- `conflict_disclosures`
- `created_at`
