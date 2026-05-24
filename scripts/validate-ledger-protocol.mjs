import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const schemaFiles = [
  "attachment-target.schema.json",
  "synthesis-snapshot.schema.json",
  "claim-record.schema.json",
  "evidence-object.schema.json",
  "ai-reader-note.schema.json",
  "human-review-decision.schema.json",
  "revision-event.schema.json",
  "contribution-record.schema.json",
];

async function readJson(relativePath) {
  const raw = await readFile(path.join(rootDir, relativePath), "utf8");
  return JSON.parse(raw);
}

function typeName(value) {
  if (Array.isArray(value)) {
    return "array";
  }

  if (value === null) {
    return "null";
  }

  return typeof value;
}

function matchesType(value, expectedType) {
  return typeName(value) === expectedType;
}

function validateValue(value, schema, schemas, location) {
  const errors = [];

  if (schema.$ref) {
    const refName = path.basename(schema.$ref);
    const refSchema = schemas[refName];
    if (!refSchema) {
      return [`${location}: unresolved schema ref ${schema.$ref}`];
    }

    return validateValue(value, refSchema, schemas, location);
  }

  if ("const" in schema && value !== schema.const) {
    errors.push(`${location}: expected const ${JSON.stringify(schema.const)}`);
  }

  if (schema.type) {
    const allowedTypes = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!allowedTypes.some((item) => matchesType(value, item))) {
      errors.push(
        `${location}: expected type ${allowedTypes.join(" | ")}, received ${typeName(value)}`,
      );
      return errors;
    }
  }

  if (schema.enum && !schema.enum.includes(value)) {
    errors.push(`${location}: value ${JSON.stringify(value)} is not in enum`);
  }

  if (typeof value === "string") {
    if (schema.minLength && value.length < schema.minLength) {
      errors.push(`${location}: string is shorter than ${schema.minLength}`);
    }

    if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
      errors.push(`${location}: string does not match ${schema.pattern}`);
    }

    if (schema.format === "date-time" && Number.isNaN(Date.parse(value))) {
      errors.push(`${location}: string is not a valid date-time`);
    }

    if (schema.format === "uri") {
      try {
        new URL(value);
      } catch {
        errors.push(`${location}: string is not a valid URI`);
      }
    }
  }

  if (Array.isArray(value)) {
    if (schema.minItems && value.length < schema.minItems) {
      errors.push(`${location}: array has fewer than ${schema.minItems} items`);
    }

    if (schema.items) {
      value.forEach((item, index) => {
        errors.push(...validateValue(item, schema.items, schemas, `${location}[${index}]`));
      });
    }
  }

  if (value && typeof value === "object" && !Array.isArray(value)) {
    for (const requiredKey of schema.required ?? []) {
      if (!(requiredKey in value)) {
        errors.push(`${location}: missing required key ${requiredKey}`);
      }
    }

    if (schema.additionalProperties === false && schema.properties) {
      for (const key of Object.keys(value)) {
        if (!(key in schema.properties)) {
          errors.push(`${location}: unexpected key ${key}`);
        }
      }
    }

    for (const [key, propertySchema] of Object.entries(schema.properties ?? {})) {
      if (key in value) {
        errors.push(
          ...validateValue(value[key], propertySchema, schemas, `${location}.${key}`),
        );
      }
    }
  }

  for (const branch of schema.allOf ?? []) {
    if (branch.if) {
      if (validateValue(value, branch.if, schemas, `${location}.__if`).length === 0) {
        errors.push(...validateValue(value, branch.then, schemas, location));
      }
    } else {
      errors.push(...validateValue(value, branch, schemas, location));
    }
  }

  if (schema.anyOf) {
    const anyBranchPassed = schema.anyOf.some(
      (branch) => validateValue(value, branch, schemas, `${location}.__anyOf`).length === 0,
    );
    if (!anyBranchPassed) {
      errors.push(`${location}: does not satisfy anyOf`);
    }
  }

  return errors;
}

function assertNoErrors(label, errors) {
  if (errors.length) {
    throw new Error(`${label} failed:\n${errors.map((item) => `- ${item}`).join("\n")}`);
  }
}

function mapById(records, idKey) {
  return new Map(records.map((item) => [item[idKey], item]));
}

function validateFixtureGraph(fixture) {
  const errors = [];
  const contribution = fixture.contribution_record;
  const aiNotes = mapById(fixture.ai_reader_notes ?? [], "ai_reader_note_id");
  const snapshots = mapById(fixture.synthesis_snapshots ?? [], "snapshot_id");
  const review = fixture.human_review_decision;
  const revision = fixture.revision_event;

  for (const noteId of contribution.ai_reader_note_ids ?? []) {
    if (!aiNotes.has(noteId)) {
      errors.push(`Contribution ${contribution.contribution_id} references missing AIReaderNote ${noteId}`);
    }
  }

  if (contribution.state !== "incorporated" && contribution.revision_event_id) {
    errors.push("Only incorporated contributions may link to a RevisionEvent.");
  }

  if (review.actual_card_change === true && !review.revision_event_id) {
    errors.push("HumanReviewDecision with actual_card_change true must include revision_event_id.");
  }

  if (review.actual_card_change === true && review.revision_event_id !== revision.revision_id) {
    errors.push("HumanReviewDecision revision_event_id does not resolve to the fixture RevisionEvent.");
  }

  if (revision.triggering_record_id !== contribution.contribution_id) {
    errors.push("RevisionEvent triggering_record_id does not resolve to the ContributionRecord.");
  }

  if (revision.review_decision_id !== review.review_decision_id) {
    errors.push("RevisionEvent review_decision_id does not resolve to the HumanReviewDecision.");
  }

  const previousSnapshot = snapshots.get(revision.previous_synthesis_snapshot_id);
  const newSnapshot = snapshots.get(revision.new_synthesis_snapshot_id);
  if (!previousSnapshot) {
    errors.push("RevisionEvent previous_synthesis_snapshot_id does not resolve.");
  }
  if (!newSnapshot) {
    errors.push("RevisionEvent new_synthesis_snapshot_id does not resolve.");
  }
  if (previousSnapshot && newSnapshot && previousSnapshot.snapshot_id === newSnapshot.snapshot_id) {
    errors.push("RevisionEvent must point to distinct before and after snapshots.");
  }
  if (newSnapshot?.source_revision_event_id !== revision.revision_id) {
    errors.push("New SynthesisSnapshot must point back to its source RevisionEvent.");
  }
  if (!revision.unresolved_after_revision?.length) {
    errors.push("RevisionEvent must preserve unresolved_after_revision.");
  }

  for (const aiNote of fixture.ai_reader_notes ?? []) {
    if ("revision_event_id" in aiNote || "creates_revision_event" in aiNote) {
      errors.push(`AIReaderNote ${aiNote.ai_reader_note_id} attempts to mutate the public record.`);
    }
  }

  const serializedPublicFixture = JSON.stringify(fixture);
  if (/"email"\s*:|"private_follow_up"|"privateNotes"/.test(serializedPublicFixture)) {
    errors.push("Fixture exposes private contributor metadata.");
  }

  return errors;
}

function evaluateConformanceCase(testCase) {
  const input = testCase.input ?? {};

  switch (testCase.id) {
    case "state-machine-pending-not-changed":
      return !(
        ["draft", "submitted", "classified", "ai_reviewed", "needs_human_review", "pending"].includes(
          input.state,
        ) && input.actual_card_change === true
      );
    case "incorporated-change-requires-revision":
      return !(input.state === "incorporated" && input.actual_card_change === true && !input.revision_event_id);
    case "revision-event-reconstructs-before-after":
      return Boolean(
        input.revision_id &&
          input.triggering_record_id &&
          input.review_decision_id &&
          input.previous_synthesis_snapshot_id &&
          input.new_synthesis_snapshot_id &&
          input.changed_fields?.length &&
          input.unresolved_after_revision?.length,
      );
    case "ai-reader-note-transparency":
      return [
        "model_provider",
        "model_name",
        "reader_role",
        "input_scope",
        "used_external_sources",
        "source_list",
        "output_summary",
        "proposed_lane",
        "proposed_review_status",
        "confidence",
        "limitations",
        "human_decision_status",
      ].every((key) => key in input);
    case "ai-reader-note-cannot-mutate-synthesis":
      return !(input.creates_revision_event === true && !input.human_review_decision_id);
    case "evidence-url-requires-url":
      return !(input.source_type === "url" && !input.url);
    case "public-private-boundary-email-redaction":
      return !(input.public_record_fields ?? []).some((field) => field.includes("email"));
    case "origin-label-preserved":
      return !(input.origin === "founder_maintainer" && input.counts_as_outside_public_submission === true);
    default:
      throw new Error(`No evaluator registered for conformance case ${testCase.id}`);
  }
}

async function main() {
  const schemas = Object.fromEntries(
    await Promise.all(
      schemaFiles.map(async (fileName) => [fileName, await readJson(`schema/${fileName}`)]),
    ),
  );
  const fixture = await readJson("examples/healthcare-topic-001-founder-maintainer-revision.fixture.json");
  const cases = await readJson("tests/conformance-cases.json");

  const schemaChecks = [
    ["ClaimRecord", fixture.claim_record, schemas["claim-record.schema.json"]],
    ["ContributionRecord", fixture.contribution_record, schemas["contribution-record.schema.json"]],
    ["HumanReviewDecision", fixture.human_review_decision, schemas["human-review-decision.schema.json"]],
    ["RevisionEvent", fixture.revision_event, schemas["revision-event.schema.json"]],
    ...fixture.synthesis_snapshots.map((item, index) => [
      `SynthesisSnapshot[${index}]`,
      item,
      schemas["synthesis-snapshot.schema.json"],
    ]),
    ...fixture.attachment_targets.map((item, index) => [
      `AttachmentTarget[${index}]`,
      item,
      schemas["attachment-target.schema.json"],
    ]),
    ...fixture.ai_reader_notes.map((item, index) => [
      `AIReaderNote[${index}]`,
      item,
      schemas["ai-reader-note.schema.json"],
    ]),
  ];

  for (const [label, value, schema] of schemaChecks) {
    assertNoErrors(label, validateValue(value, schema, schemas, label));
  }

  assertNoErrors("fixture graph", validateFixtureGraph(fixture));

  const caseErrors = [];
  for (const testCase of cases.cases ?? []) {
    const actualValid = evaluateConformanceCase(testCase);
    if (actualValid !== testCase.expected_valid) {
      caseErrors.push(`${testCase.id}: expected ${testCase.expected_valid}, received ${actualValid}`);
    }
  }

  assertNoErrors("conformance cases", caseErrors);

  console.log(
    [
      "Reasoning Ledger protocol check passed.",
      `Schemas checked: ${schemaChecks.length}`,
      `Conformance cases checked: ${(cases.cases ?? []).length}`,
      `Fixture: ${cases.fixture_under_test}`,
    ].join("\n"),
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
