# Civic Logos V2 Deploy Log

## 2026-05-26 - V2 Controlled Update

Release candidate commit:

- `ffe6fab` - `Prepare Civic Logos V2 release candidate`

Preview deployment:

- URL: `https://civiclogos-site-4puzgvsl1-civic-logos.vercel.app`
- Vercel deployment ID: `dpl_97tfGEowif1MBuvrrExtZBjrhPf1`
- Result: passed

Preview checks:

- `npm run https:smoke:check -- https://civiclogos-site-4puzgvsl1-civic-logos.vercel.app`
- `/challenge` rendered the public challenge page.
- `/rooms/physics-foundations/topic-001` rendered the Physics Foundations topic.
- `/review/contributions` showed the maintainer lock screen.
- Read-only healthcare ask returned read-only mode and created no candidate.
- Healthcare contribution-style ask created a pre-ledger candidate only.
- Symbolic physics input routed to `physics-foundations/topic-001`.
- Ambiguous input became `needs_routing`.
- False-positive prompts stayed unrouted.
- `visibleRecords` stayed at `10` during `/ask` checks.
- `revisionEvents` stayed at `1`.
- Synthesis text and current synthesis snapshot did not change.

Production deployment:

- URL: `https://civiclogos.com`
- Vercel deployment ID: `dpl_BT98qTmXKQo6p5H4aue79dqXYG27`
- Result: passed

Production checks:

- `npm run https:smoke:check -- https://civiclogos.com`
- `/` rendered the V2 root chat shell.
- `/ask` rendered the shared chat shell.
- `/about` preserved the old homepage.
- `/ledger` rendered the V2 candidate-intake status.
- `/demo` rendered the healthcare V2 example.
- `/challenge` rendered the public challenge page.
- `/healthcare/topic-001?view=ledger` rendered the healthcare ledger view.
- `/rooms/physics-foundations/topic-001` rendered the Physics Foundations topic.
- `/review/contributions` showed the maintainer lock screen.
- Read-only healthcare ask returned read-only mode and created no candidate.
- Healthcare contribution-style ask created a pre-ledger candidate only.
- Symbolic physics input routed to `physics-foundations/topic-001`.
- Ambiguous input became `needs_routing`.
- False-positive prompts stayed unrouted.
- No `/ask` path created a public `ContributionRecord`.
- No `/ask` path created a `RevisionEvent`.
- No `/ask` path changed synthesis.
- Production candidate intake reported database-backed storage in the HTTPS smoke script.
- `visibleRecords` stayed at `10` during `/ask` checks.
- `revisionEvents` stayed at `1`.
