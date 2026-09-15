---
title: "Converge execute_simple/grouped_calculation: drop applyJoinDependency, use model.with_connection"
status: done
updated: 2026-09-15
rfc: "0073-permanent-connection-checkout-disallowed"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#7823
claim: "2026-09-15T22:31:15Z"
assignee: "converge-calculation-execute-join-dependency-and-model-connection"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/relation/calculations.ts` `executeSimpleCalculation` (~:739) and
`executeGroupedCalculation` (~:810) each call `rel.applyJoinDependency(...)` when eager loading, and
both run their query through `rel.withConnection`.

Rails `activerecord/lib/active_record/relation/calculations.rb`:

- `execute_simple_calculation` (:468-509) and `execute_grouped_calculation` (:513-593) have no
  `apply_join_dependency`; `calculate` already does `relation = apply_join_dependency` under
  `has_include?(column_name)` (:231-232) before dispatching.
- Both use `model.with_connection` (:497, :527), not the relation's.

## Acceptance criteria

- Neither execute method calls `applyJoinDependency`; the eager-load join is applied only in
  `calculate`, as at `calculations.rb:231-232`.
- Both run under `rel.model.withConnection`, as at `:497` / `:527`.
- `pnpm parity:api:calls` green; calculations tests green on all adapters.
