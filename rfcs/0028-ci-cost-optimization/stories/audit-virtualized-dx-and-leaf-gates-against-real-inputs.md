---
title: "Audit virtualized-DX / leaf / trailties gates against their real source closure"
status: done
updated: 2026-08-07
rfc: "0028-ci-cost-optimization"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6181
claim: "2026-08-07T16:37:44Z"
assignee: "port-command-recorder-test-cases-part-2"
blocked-by: null
closed-reason: null
---

## Context

Three jobs gate on plain `activerecord_affected`, so they run on every AR PR
even though their real inputs are narrower. Measured over 400 `pull_request`
runs in a 29.5 h window:

| Job                         | Executions |           Burn | Gate                                             |
| --------------------------- | ---------: | -------------: | ------------------------------------------------ |
| `virtualized-dx-type-tests` |        285 | 327 min (3.0%) | `activerecord_affected \|\| trails_tsc_affected` |
| `trailties-tests`           |        281 | 261 min (2.4%) | `trailties_affected` (includes all of AR)        |
| `leaf-tests`                |        285 | 225 min (2.1%) | rack ∨ actionview ∨ tse ∨ AR ∨ trailties         |

`virtualized-dx-type-tests` only runs `pnpm test:types:virtualized`. If its real
inputs are `packages/trails-tsc/` plus AR's `type-virtualization` / `tsc-wrapper`
subtrees rather than all of `packages/activerecord/`, the gate can be narrowed
the way `tighten-guides-typecheck-gate` (PR #5530) narrowed guides. Upper bound
if all three narrow: ~1,800 job-min/week.

This is an AUDIT first, not a gate change. PR #5749 established that naive path
narrowing is dangerous here: of 12 runs with a PG/MariaDB-specific failure, only
1 touched adapter-ish paths. Verify what each suite actually imports before
touching a gate; a wrong narrowing hides real breakage.

## Acceptance criteria

- [ ] For each of the three jobs, the actual import/source closure of the suite
      it runs is documented (not inferred from the job name).
- [ ] Gates narrowed only where the closure demonstrably supports it; otherwise
      the story closes with the audit written up and the gate left alone.
- [ ] `scripts/ci-suite-coverage.test.ts` pins any narrowed gate in both
      directions, as the `db_adapter_affected` gate is pinned.
