# Civic Logos V2 Live Monitoring

24-hour production stability and usage watch for the V2 controlled update.

Monitoring window started: 2026-05-27T03:05:26Z (2026-05-26 21:05 MDT)

Scope:
- No feature expansion.
- No new rooms, topic cards, RealityNode/Baseline ontology, or protocol-model changes.
- No routing changes unless a production bug appears.
- Public-record trust boundary must remain intact.

Commands used for baseline:
- `npm run https:smoke:check -- https://civiclogos.com`
- Direct HTTPS route checks against `https://civiclogos.com`
- Direct `/api/ai/ask` prompt checks against `https://civiclogos.com`
- Direct healthcare ledger export check against `/api/ledger/healthcare/topic-001`

## Baseline Snapshot

Timestamp: 2026-05-27T03:05:26Z

Ledger state before prompt checks:
- visibleRecords: 10
- outside public submissions: 0
- maintainer-promoted V2 candidates: 3
- formal RevisionEvents: 1
- synthesis snapshot: `snapshot:healthcare-topic-001:v0.2`

Ledger state after prompt checks:
- visibleRecords: 10
- outside public submissions: 0
- maintainer-promoted V2 candidates: 3
- formal RevisionEvents: 1
- synthesis snapshot: `snapshot:healthcare-topic-001:v0.2`

Invariant result: pass. No public ContributionRecord, RevisionEvent, or synthesis change was created by `/ask`.

## Route Health

| Timestamp | Route checked | Expected behavior | Actual behavior | Error | Fix required |
| --- | --- | --- | --- | --- | --- |
| 2026-05-27T03:05:26Z | `/` | Main V2 chat shell renders | 200 OK at `https://www.civiclogos.com/` | None | No action |
| 2026-05-27T03:05:26Z | `/ask` | Shared chat shell renders | 200 OK | None | No action |
| 2026-05-27T03:05:26Z | `/about` | Old homepage narrative renders | 200 OK | None | No action |
| 2026-05-27T03:05:26Z | `/ledger` | Public audit surface renders | 200 OK | None | No action |
| 2026-05-27T03:05:26Z | `/demo` | V2 demo page renders | 200 OK | None | No action |
| 2026-05-27T03:05:26Z | `/challenge` | Challenge page renders | 200 OK | None | No action |
| 2026-05-27T03:05:26Z | `/healthcare/topic-001?view=ledger` | Healthcare ledger view renders | 200 OK | None | No action |
| 2026-05-27T03:05:26Z | `/rooms/physics-foundations/topic-001` | Existing Physics Foundations topic renders | 200 OK | None | No action |
| 2026-05-27T03:05:26Z | `/review/contributions` | Maintainer review remains gated | 200 OK lock screen detected | None | No action |

## Ask Behavior

| Timestamp | Prompt tested | Expected behavior | Actual behavior | Candidate created? | Public record mutation? | Error | Fix required |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-05-27T03:05:26Z | What changed in this card? | Read-only healthcare answer, no candidate | `read-only`, `what_changed`, `healthcare/topic-001` | No | No | None | No action |
| 2026-05-27T03:05:26Z | What remains unresolved? | Read-only answer, no candidate | `read-only`, `unresolved_questions`, `healthcare/topic-001` | No | No | None | No action |
| 2026-05-27T03:05:26Z | What does the Physics Foundations card say about Planck identities? | Read-only physics answer, no candidate | `read-only`, `planck_identity_status`, `physics-foundations/topic-001` | No | No | None | No action |
| 2026-05-27T03:05:26Z | What would move the physics card forward? | Read-only physics answer, no candidate | `read-only`, `what_would_move_this_card`, `physics-foundations/topic-001` | No | No | None | No action |
| 2026-05-27T03:05:26Z | This healthcare claim assumes savings will reach patients, but institutions may capture them. | Healthcare pre-ledger candidate only | `candidate`, `healthcare/topic-001`, `pending_human_review`, candidate `09c3c1b4-e50c-4548-9444-5dfdec1fabf7` | Yes | No | None | No action |
| 2026-05-27T03:05:26Z | 0 -> i + (-i) -> i*(-i) -> 1 | Physics/symbolic pre-ledger candidate only | `candidate`, `physics-foundations/topic-001`, `pending_human_review`, candidate `0ae4c513-903b-418a-baec-e08143483f79` | Yes | No | None | No action |
| 2026-05-27T03:05:26Z | This seems wrong but I don't know where it belongs. | Unrouted candidate needing routing only | `candidate`, `unrouted/unrouted`, `needs_routing`, candidate `c95d8528-edcd-40f2-8dbb-a2dddc6fb106` | Yes | No | None | No action |

## Invariants

| Timestamp | Invariant | Result | Notes |
| --- | --- | --- | --- |
| 2026-05-27T03:05:26Z | Read-only asks create no candidates | Pass | Healthcare and Physics read-only prompts returned `candidate: null`. |
| 2026-05-27T03:05:26Z | Contribution prompts create pre-ledger candidates only | Pass | Candidate records had `publicSubmission: false` and `actualCardChange: false`. |
| 2026-05-27T03:05:26Z | Ambiguous prompts stay unrouted | Pass | Ambiguous prompt returned `unrouted/unrouted` with `needs_routing`. |
| 2026-05-27T03:05:26Z | No `/ask` path creates public ContributionRecords | Pass | `visibleRecords` stayed 10. |
| 2026-05-27T03:05:26Z | No `/ask` path creates RevisionEvents | Pass | formal RevisionEvents stayed 1. |
| 2026-05-27T03:05:26Z | No `/ask` path changes synthesis | Pass | Synthesis text and snapshot ID stayed stable. |
| 2026-05-27T03:05:26Z | `/review/contributions` remains gated | Pass | Lock screen detected. |

## Ongoing Watch

Hourly checks are scheduled for the next 24 hours. Each run should append a timestamped entry with route health, ask behavior, invariant results, errors, and whether a production fix is required.
