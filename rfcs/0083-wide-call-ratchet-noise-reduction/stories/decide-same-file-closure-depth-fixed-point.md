---
title: "Decide whether SAME_FILE_CLOSURE_DEPTH should move from 3 to its measured fixed point (8)"
status: done
updated: 2026-07-31
rfc: "0083-wide-call-ratchet-noise-reduction"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 5750
claim: "2026-07-31T20:32:53Z"
assignee: "decide-same-file-closure-depth-fixed-point"
blocked-by: null
closed-reason: null
---

## Context

Measured while shipping `evaluate-loose-any-method-wide-resolution` (PR #5738)
by env-overriding `SAME_FILE_CLOSURE_DEPTH` (`compare.ts:353`) and regenerating
the wide artifact at each value:

| depth     | rows |    Δ |
| --------- | ---: | ---: |
| 0         | 3693 |    — |
| 1         | 3332 | −361 |
| 2         | 3276 |  −56 |
| 3 (today) | 3251 |  −25 |
| 4         | 3243 |   −8 |
| 5         | 3236 |   −7 |
| 6         | 3236 |    0 |
| 8         | 3230 |   −6 |
| 12, 40    | 3230 |    0 |

Depth 8 is the fixed point: nothing above it changes the artifact. The closure
saturates on the same schedule — mean effective call-set per body 2.35 (depth 0)
→ 6.77 (depth 3) → 9.00 (depth 8) → 9.05 (depth 12 = depth 40).

Raising 3 → 8 is sound in the way the delegation cap is not: the closure stays
scoped to one file and to names the body actually reaches, so it cannot credit
a sibling adapter. But it is worth only −21 rows (0.6%), and the 16 unique keys
it drops are ones a reviewer might want to keep: `relation.ts#toSql` missing
`apply_join_dependency`, `#updateAll` / `#deleteAll` / `#ids` missing
`arel_columns`, `#execQueries` missing `preload_associations` — all inside the
420-row `relation.ts`, discharged by a helper several hops away.

Decide whether that trade is worth a reseed; the answer may well be no, in which
case close this and record the measurement as the justification for 3.

## Acceptance criteria

- Decide adopt/reject for depth 8 with the 16 dropped keys as evidence.
- If adopting: bump `SAME_FILE_CLOSURE_DEPTH`, reseed
  (`pnpm parity:api:calls:reseed`), and record the delta; `droppedReviewed` must
  print any hand-reviewed row that vanishes.
- If rejecting: update the `SAME_FILE_CLOSURE_DEPTH` docstring to cite the
  measured fixed point rather than the current qualitative rationale.
- `DELEGATION_MAX_CALLS` is NOT in scope — its imprecision is package-wide (see
  the sibling story), and the same sweep showed raising it silences
  `base.ts#destroy` missing `with_transaction_returning_status`.
