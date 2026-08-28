---
title: "Measure the assertion-mismatch burn rate and price promoting the ratchet to a hard gate"
status: ready
updated: 2026-08-01
rfc: "0127-fidelity-tooling-signals-and-hygiene"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: 9
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

## Re-verified 2026-08-17 (ready sweep)

**The spike this story asks for is now answerable — data below, measured
2026-08-17 from `git log` on `scripts/test-compare/assertion-mismatch-mark.json`.**

activerecord `assertionCount / kind / value`:

| date       | mark             |
| ---------- | ---------------- |
| 2026-08-01 | 1987 / 4069 / 54 |
| 2026-08-05 | 1987 / 4069 / 54 |
| 2026-08-14 | 1977 / 4066 / 49 |
| 2026-08-16 | 1977 / 4066 / 49 |
| 2026-08-17 | 1965 / 4008 / 39 |

Over 16 days: assertionCount -22 (~9.6/week), kind -61 (~26.7/week),
value -15 (~6.6/week).

Projected to zero at that rate: **assertionCount ~205 weeks (~3.9 years)**,
**kind ~150 weeks (~2.9 years)**, **value ~6 weeks**.

So the answer to "is hard-zero promotion reachable inside the release scope"
is almost certainly **no for assertionCount and kind, and yes for value**.
That asymmetry is the finding: promoting `value` alone to a hard gate is
cheap and defensible; promoting the other two is not, at any plausible
per-PR budget. Remaining work is to sanity-check the trend over more points
(five marks, three distinct values, is thin) and record the decision where the
release estimate lives.
