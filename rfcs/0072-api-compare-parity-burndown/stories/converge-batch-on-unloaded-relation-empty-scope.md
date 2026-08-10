---
title: "converge-batch-on-unloaded-relation-empty-scope"
status: done
updated: 2026-08-03
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5898
claim: "2026-08-02T17:49:30Z"
assignee: "converge-batch-on-unloaded-relation-empty-scope"
blocked-by: null
closed-reason: null
---

## Context

Split out of `converge-calculation-and-batch-dispatch-shim-bodies` (#5897),
which converged the `ensure_valid_options_for_batching!` and
`perform_calculation` bodies but left the `batch_on_unloaded_relation` wide
entries (`all`, `any?`, `model`, `to_sql`, `unscoped`) baselined in
`scripts/api-compare/call-mismatches-wide-exclude/activerecord/relation/batches.json`.

Rails `batch_on_unloaded_relation`
(`vendor/rails/activerecord/lib/active_record/relation/batches.rb:426-470`)
computes `empty_scope = to_sql == model.unscoped.all.to_sql` and uses it to
decide range mode: `(empty_scope && use_ranges != false) || use_ranges`. In
trails that decision lives inline in `Relation#inBatches`
(`packages/activerecord/src/relation.ts` — `effectiveUseRanges`, computed from
`_whereClause.predicates.length === 0 && _limitValue === null &&
_offsetValue === null` rather than from a `to_sql` comparison), and the
range-mode `col >= first AND col <= last` predicate is applied in `inBatches`
too, because `batchOnUnloadedRelation`
(`packages/activerecord/src/relation/batches.ts`) is an async generator that
yields raw rows while Rails' yields relations.

## Acceptance criteria

- `empty_scope` is computed inside `batchOnUnloadedRelation` from
  `relation.toSql() === model.unscoped().all().toSql()`, matching batches.rb:432,
  and drives the range-mode decision there rather than in `inBatches`.
- The `use_ranges` handling (`(empty_scope && use_ranges != false) || use_ranges`)
  moves with it.
- `pnpm parity:api:calls:reseed` clears the `batch_on_unloaded_relation` entries in
  `relation/batches.json`, or the survivors carry a real per-entry reason.
- `packages/activerecord/src/batches.test.ts` stays green; no test renames.
