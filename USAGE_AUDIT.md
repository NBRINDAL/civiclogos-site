# Civic Logos V2 Usage Audit

Audit date: May 27, 2026

Live target: `https://civiclogos.com`

Scope: V2 Phase 3 `/ask` behavior across healthcare read-only, healthcare contribution, Physics Foundations read-only, physics contribution, symbolic/foundational input, ambiguous input, false-positive input, and bad-fit/general input.

## Summary

- Prompts tested: 20
- Public `visibleRecords`: stayed at `10`
- Formal `RevisionEvents`: stayed at `1`
- Outside public submissions: stayed at `0`
- Healthcare synthesis snapshot: stayed at `snapshot:healthcare-topic-001:v0.2`
- Healthcare synthesis text: unchanged
- Public record mutation from `/ask`: none observed
- Read-only answers: returned explicit read-only note and records used
- Candidate responses: remained pre-ledger with `publicSubmission: false` and `actualCardChange: false`

One release-blocking issue was found and fixed during the audit: `What would move the physics card forward?` initially became an unrouted candidate instead of a Physics read-only answer. The fix was deployed in commit `31f22a5` and verified on production: it now returns `read-only`, routes to `physics-foundations/topic-001`, creates no candidate, and does not mutate the public record.

## Prompt Results

| # | Category | Prompt | Expected mode | Actual mode | Route result | Candidate created? | Public record mutation? | User-facing clarity | Notes |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Healthcare read-only | `What changed in the healthcare card?` | read-only | read-only | `healthcare/topic-001`; `what_changed` | No | No | Clear: read-only note plus records used. | Passed. |
| 2 | Healthcare read-only | `What remains unresolved?` | read-only | read-only | `healthcare/topic-001`; `unresolved_questions` | No | No | Clear: read-only note plus records used. | Passed. |
| 3 | Healthcare read-only | `What evidence is attached?` | read-only | read-only | `healthcare/topic-001`; `evidence_summary` | No | No | Clear: read-only note plus records used. | Passed. |
| 4 | Healthcare contribution | `This healthcare claim assumes savings will reach patients, but institutions may capture them.` | candidate | candidate | `healthcare/topic-001`; routed; high confidence | Yes | No | Clear: route reason plus pre-ledger flags. | Candidate only. |
| 5 | Healthcare contribution | `AI triage may create liability and human escalation problems.` | candidate | candidate | `healthcare/topic-001`; routed; high confidence | Yes | No | Clear: route reason plus pre-ledger flags. | Candidate only. |
| 6 | Healthcare contribution | `Administrative simplification might have transition costs.` | candidate | candidate | `healthcare/topic-001`; routed; high confidence | Yes | No | Clear: route reason plus pre-ledger flags. | Candidate only. |
| 7 | Physics read-only | `What does the physics card say about Planck identities?` | read-only | read-only | `physics-foundations/topic-001`; `planck_identity_status` | No | No | Clear: read-only note plus records used. | Passed. |
| 8 | Physics read-only | `What are the standard baselines?` | read-only | read-only | `physics-foundations/topic-001`; `standard_baselines` | No | No | Clear: read-only note plus records used. | Passed. |
| 9 | Physics read-only | `Is this treating Planck identities as definitions or physical proof?` | read-only | read-only | `physics-foundations/topic-001`; `definition_vs_interpretation` | No | No | Clear: read-only note plus records used. | Passed. |
| 10 | Physics read-only | `What would move the physics card forward?` | read-only | read-only after fix | `physics-foundations/topic-001`; `what_would_move_this_card` | No after fix | No | Clear: read-only note plus records used. | Initially returned an unrouted candidate; fixed and verified on production. |
| 11 | Physics contribution | `Planck identities may reveal physical structure, not just definitions.` | candidate | candidate | `physics-foundations/topic-001`; routed; medium confidence | Yes | No | Clear: route reason plus pre-ledger flags. | Candidate only. |
| 12 | Physics contribution | `Quantum gravity needs a baseline between GR and QM.` | candidate | candidate | `physics-foundations/topic-001`; routed; high confidence | Yes | No | Clear: route reason plus pre-ledger flags. | Candidate only. |
| 13 | Symbolic/foundational input | `0 -> i + (-i) -> i*(-i) -> 1` | candidate | candidate | `physics-foundations/topic-001`; routed; high confidence | Yes | No | Clear: route reason plus pre-ledger flags. | Candidate only. |
| 14 | Symbolic/foundational input | `Collapse sequence around Planck-scale constants may be a symbolic reformulation, not empirical evidence.` | candidate | candidate | `physics-foundations/topic-001`; routed; medium confidence | Yes | No | Clear: route reason plus pre-ledger flags. | Candidate only. |
| 15 | Ambiguous input | `This seems wrong but I don't know where it belongs.` | candidate | candidate | `unrouted/unrouted`; `needs_routing` | Yes | No | Clear: needs-routing explanation plus pre-ledger flags. | Conservative routing held. |
| 16 | Ambiguous input | `This idea affects everyone eventually.` | candidate | candidate | `unrouted/unrouted`; `needs_routing` | Yes | No | Clear: needs-routing explanation plus pre-ledger flags. | Conservative routing held. |
| 17 | False-positive input | `The system is broken.` | candidate | candidate | `unrouted/unrouted`; `needs_routing` | Yes | No | Clear: needs-routing explanation plus pre-ledger flags. | Did not over-route to healthcare. |
| 18 | False-positive input | `Energy affects many systems.` | candidate | candidate | `unrouted/unrouted`; `needs_routing` | Yes | No | Clear: needs-routing explanation plus pre-ledger flags. | Did not over-route to physics. |
| 19 | False-positive input | `There is a deeper symbolic pattern here.` | candidate | candidate | `unrouted/unrouted`; `needs_routing` | Yes | No | Clear: needs-routing explanation plus pre-ledger flags. | Did not over-route to physics. |
| 20 | Bad-fit/general input | `Can you summarize my grocery list and tell me where it belongs?` | candidate | candidate | `unrouted/unrouted`; `needs_routing` | Yes | No | Clear enough: it is held internally instead of routed publicly. | Not a public-record mutation; reviewer can reject/archive. |

## Safety Checks

- No tested `/ask` path created a public `ContributionRecord` directly.
- No tested `/ask` path created a `RevisionEvent`.
- No tested `/ask` path changed healthcare synthesis text or synthesis snapshot.
- No tested `/ask` path changed public `visibleRecords`.
- Read-only answers exposed `Records used` and the note: `This answer is read-only. No candidate was created.`
- Candidate answers exposed routing metadata and stayed `publicSubmission: false`, `actualCardChange: false`.

## Notes

- The live audit intentionally created internal pre-ledger candidates for contribution, ambiguous, false-positive, and bad-fit prompts. These did not enter the public ledger and should be reviewed, rejected, or archived through the maintainer queue if they are only audit artifacts.
- Routing behaved conservatively after the fix: strong healthcare and physics signals routed to existing topics; weak, generic, or bad-fit prompts stayed `needs_routing`.
- The read-only/candidate distinction is understandable on the response surface because read-only answers show records used, while candidate responses show route status, confidence, and pre-ledger flags.
