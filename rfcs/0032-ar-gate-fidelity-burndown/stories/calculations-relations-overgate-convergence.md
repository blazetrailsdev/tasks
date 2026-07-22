---
title: "calculations-relations-overgate-convergence"
status: ready
updated: 2026-07-22
rfc: "0032-ar-gate-fidelity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`test:compare --gates` (2026-07-22, 22 activerecord gate mismatches) — 5 in
`calculations.test.ts` / `relations.test.ts` with no story:

- [over-gated] "finding with sanitized order" —
  packages/activerecord/src/relations.test.ts:700 splits the Rails test into
  `skipIf(mysql)` + a trails-invented "(mysql)" twin at :709; Rails
  (vendor/rails/activerecord/test/cases/relations_test.rb:476) is
  unconditional. Merge back to one unconditional test (branch on adapter
  inside the body only if Rails does).
- [over-gated] "should limit calculation" (calculations.test.ts:274),
  "should limit calculation with offset" (:286), "should calculate with
  invalid field" (:552) — gated `skipIf(adapterType !== "sqlite")`; Rails
  (calculations_test.rb:273 ff) runs them unconditionally. Un-gate and make
  them pass on pg/mysql lanes.
- [should-gate] "group by with order by virtual count attribute"
  (calculations.test.ts:1351) — unconditional in trails; Rails
  (calculations_test.rb:1202) is `current_adapter?(:PostgreSQLAdapter)`-only.
  Add the postgresql gate.

## Acceptance criteria

- [ ] The 5 tests' extracted gates equal railsGate; `test:compare --gates`
      reports no mismatch for them. Test names unchanged (delete the invented
      "(mysql)" twin).
- [ ] Un-gated tests pass on all lanes the Rails gate implies.
