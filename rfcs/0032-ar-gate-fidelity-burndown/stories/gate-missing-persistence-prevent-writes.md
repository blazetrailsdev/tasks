---
title: "Gate missing-gate duplicate-variant tests in persistence + adapter_prevent_writes (8)"
status: in-progress
updated: 2026-06-20
rfc: "0032-ar-gate-fidelity-burndown"
cluster: missing-gate
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 3718
claim: "2026-06-20T14:25:28Z"
assignee: "gate-missing-persistence-prevent-writes"
blocked-by: null
---

## Context

RFC `0032-ar-gate-fidelity-burndown`, cluster `missing-gate`. Follow-up from
`gate-missing-gate-burndown` (PR #3708). 8 `missing-gate` mismatches across
`persistence.test.ts` (6) and `adapter-prevent-writes.test.ts` (2). These were
deliberately deferred because they carry **duplicate-named Rails adapter
variants** that need special handling beyond a simple gate wrapper:

- `persistence_test.rb`: `fills auto populated columns on creation` exists in
  THREE adapter-specific Rails classes (pg / sqlite / mysql each gating to its
  own adapter); our single TS test must reconcile against all three. Also
  `create model with uuid pk populates id` / `custom named uuid pk` (pg-only),
  and `model with no auto populated fields …` (`supports_insert_returning?`).
- `adapter_prevent_writes_test.rb`: `doesnt error when a select query has
encoding errors` is defined TWICE in the same class — a PG variant (raises
  StatementInvalid) and a non-PG variant (assert_nothing_raised). Our active TS
  test implements the SQLite/non-PG variant; a second `it.skip` is the PG
  variant. Gating must split these so each pairs with the right Rails variant
  (gate active → sqlite+mysql, keep pg variant pending). Plus the CTE
  prevent-writes test (`supports_common_table_expressions?`).

Refresh exact gates via `pnpm test:compare --package activerecord --gates --json`.

## Acceptance criteria

- [ ] Reconcile the duplicate-named variants so each TS test pairs with the
      correct Rails adapter variant and `classifyGateMismatch` returns null
      (apply the matching adapter/feature gate; keep impl-blocked PG variants
      `it.skip` with `BLOCKED:`/`ROOT-CAUSE:` and register convergence stories
      if needed).
- [ ] `test:compare --gates` reports 0 `missing-gate` for both
      `persistence.test.ts` and `adapter-prevent-writes.test.ts`.
- [ ] Test names unchanged. No stubs. 500-LOC ceiling.
