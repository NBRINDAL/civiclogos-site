# Civic Logos Reasoning Ledger Protocol

This directory supports the draft Reasoning Ledger protocol.

Start here:

- `/spec/00-charter.md` defines the protocol purpose and invariants.
- `/spec/01-core-objects.md` defines the public record objects.
- `/spec/02-state-machine-and-rules.md` defines state transitions and record-change rules.
- `/schema/*.schema.json` contains draft JSON Schemas for implementers.
- `/examples/healthcare-topic-001-founder-maintainer-revision.fixture.json` models one complete public-record change.
- `/tests/conformance-v0.1.md` describes conformance tests.
- `/tests/conformance-cases.json` provides machine-readable test cases.
- `/api/ledger/healthcare/topic-001` exports the current healthcare topic ledger in the protocol shape.

Run `npm run protocol:check` to validate the canonical fixture against the v0.1 schemas and cross-record conformance rules.

Current status: protocol v0.1 is being formalized. Civic Logos is the live prototype; a standalone reference implementation is next.

Protocol invariant: AI assists the record. Human review moves the record.
