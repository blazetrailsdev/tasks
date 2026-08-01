---
title: "Measure the assertion-mismatch burn rate and price promoting the ratchet to a hard gate"
status: ready
updated: 2026-08-01
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0025's assertion-mismatch-ratchet story (PR #5790) landed the only-shrink
gate specifically so the assertion-level burn rate becomes measurable, and
recorded that the ActiveRecord release estimate needs that rate to price the
"promote to release gate" option — the path `scripts/test-compare/gates.ts`
already took for gate-mismatch (advisory -> ratchet -> hard zero via
`--check` / `GATE_ENFORCED_PACKAGES`).

Nothing has measured the rate yet: the mark was seeded on 2026-07-31 at
1,987 / 4,069 / 54 for activerecord and there is one data point.

## Acceptance criteria

- Spike: after enough merges to have a trend, read the mark's git history
  (`git log -p scripts/test-compare/assertion-mismatch-mark.json`) and report
  the per-week burn rate for each of the three counters.
- State whether a hard-zero promotion is reachable inside the release scope,
  and if so under what per-PR convergence budget.
- Record the answer where the release estimate is maintained; file the
  promotion itself as a separate story if the numbers support it.
