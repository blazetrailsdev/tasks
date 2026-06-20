---
title: "Gate missing-gate tests in insert_all_test.rb (53)"
status: done
updated: 2026-06-20
rfc: "0032-ar-gate-fidelity-burndown"
cluster: missing-gate
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: 3715
claim: "2026-06-20T13:49:29Z"
assignee: "gate-missing-insert-all"
blocked-by: null
---

## Context

RFC `0032-ar-gate-fidelity-burndown`, cluster `missing-gate`. Follow-up split
from `gate-missing-gate-burndown` (PR #3708 closed 13 of 20 files). 53
`missing-gate` mismatches remain in
`packages/activerecord/src/insert-all.test.ts`. Rails gates these in
`vendor/rails/activerecord/test/cases/insert_all_test.rb` via
`skip unless supports_insert_on_duplicate_skip?` /
`supports_insert_on_duplicate_update?` / `supports_insert_returning?` /
`supports_insert_conflict_target?` / `supports_expression_index?` /
`supports_partial_index?`, plus a few `current_adapter?(:Mysql2Adapter,
:TrilogyAdapter)` adapter guards. The TS port runs them unconditionally.

Refresh exact per-test gates: `pnpm test:compare --package activerecord --gates
--json` then read `insert-all.test.ts` `gateMismatches[]` where
`kind == "missing-gate"`.

## Acceptance criteria

- [ ] Apply the exact Rails gate to each of the 53 tests via
      `itIfSupports("<feature>", …)` / `describeIfSupports` (feature predicates)
      and `describe.skipIf`/`it.skipIf(adapterType …)` (adapter sets) so
      `classifyGateMismatch` returns null.
- [ ] `test:compare --package activerecord --gates` reports 0 `missing-gate`
      for `insert-all.test.ts`.
- [ ] Test names unchanged. No new stubs. 500-LOC ceiling — split further if needed.
