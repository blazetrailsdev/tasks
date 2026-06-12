---
title: "pluck: thread from()/CTE through the manager (remove arel_table-only projection)"
status: in-progress
updated: 2026-06-12
rfc: "0022-relation-arel-ast-convergence"
cluster: from
deps: ["from-clause-arel-manager"]
deps-rfc: []
est-loc: 300
priority: 2
pr: 3148
claim: "2026-06-12T16:17:56Z"
assignee: "pluck-from-cte-threading"
blocked-by: null
---

## Context

Follow-on to `from-clause-arel-manager`. `pluck` (relation.ts ~L3110–3140) builds
its projection off `table` (= the model's `arel_table`) and applies only
joins/wheres/order/distinct/limit/offset to a `table.project(...)` manager — it
never sees `from()` or CTE clauses. This is the exact deviation PR #3105
documented:

> `pluck` does not thread `from()`/CTE clauses (it projects off the model's
> arel_table) … the id-set assertions go through `order("id").toArray()` + id
> extraction rather than `pluck(:id)`.

Rails' `pluck` builds on the same relation arel as a normal read, so `from_clause`
and `with` flow through. Once FROM lives on the manager (previous story) and CTEs
resolve to arel (`cte-build-with-expression-ast`), `pluck` can build its manager
from the same source.

## Scope

- Make `pluck` set FROM on its projection manager (via the shared `build_from`
  path from the previous story) and apply CTE/`with` clauses, so `pluck(:id)`
  reads from the `from()` target / CTE rather than always `arel_table`.
- Reconcile the projection target: when `from()` aliases the source, the plucked
  columns resolve against the alias (matching `toArray`).
- Restore the `with.test.ts` id-set assertions to `order(:id).pluck(:id)` (the
  Rails form) where PR #3105 had to fall back to `order("id").toArray()` + manual
  id extraction — **without** renaming any test.

## Rails source

- `vendor/rails/activerecord/lib/active_record/relation/calculations.rb` `pluck`
  (builds on the relation arel, honoring `from_clause` / `with`).
- `query_methods.rb` `build_from` (shared with the previous story).

## Test assertions

- `vendor/rails/activerecord/test/cases/relation/with_test.rb` — the CTE id-set
  cases use `pluck(:id)` against a `from("cte AS posts")` source.
- `from_test.rb` pluck-with-from cases.
- trails mirror: `packages/activerecord/src/relation/with.test.ts` — switch the
  fallback assertions back to `pluck` form.

## Acceptance criteria

- [ ] `pluck` honors `from()` and CTE/`with` clauses (manager-built, not
      `arel_table`-only).
- [ ] `with.test.ts` id-set assertions use `order(:id).pluck(:id)`; no test
      renames; all currently-passing cases stay green.
- [ ] `pnpm vitest run packages/activerecord/src/relation/with.test.ts` and the
      `from` test file pass on SQLite (+ PG/MySQL where adapter-gated).
      `test:compare` delta ≥ 0.

## Notes

- Depends on FROM being on the manager (`from-clause-arel-manager`) and CTEs
  resolving to arel (`cte-build-with-expression-ast`); claim after the former
  lands, and prefer after the latter for the CTE-pluck cases.
