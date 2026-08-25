---
title: "wave-2c-grouped-calculation-and-query-method-stores"
status: done
updated: 2026-08-16
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6603
claim: "2026-08-16T18:12:21Z"
assignee: "wave-2c-grouped-calculation-and-query-method-stores"
blocked-by: null
closed-reason: null
---

## Context

Follow-up to `wave-2b-query-methods-calculations` (PR #6587), which took
`relation/query-methods.json` from 47 → 26 rows and
`relation/calculations.json` from 27 → 25 and hit the LOC ceiling. The
remaining rows all need a backing store or a helper unwound first, which is
why they were not folded into that PR.

Measured after #6587, over
`scripts/api-compare/call-mismatches-exclude/activerecord/relation/`:

- `relation/calculations.ts` `execute_grouped_calculation` — 14 rows
  (`except`, `distinct!`, `new`, `operation_over_aggregate_column`,
  `quote_column_name`, `select_values`, `skip_query_cache_if_necessary`,
  `primary_key`, `where`, `type_for`, `lookup_cast_type_from_join_dependencies`,
  `type_cast_calculated_value`, …). The whole body delegates to the bespoke
  `groupedAggregate` helper (`relation/calculations.ts`), which Rails has no
  counterpart for. Rails' body is calculations.rb:512-586 and must be ported
  method-for-method, with `ColumnAliasTracker`, the belongs_to `key_records`
  arm and the `key_types` / `hash_rows` construction in place.
- `relation/query-methods.ts` `build_with` (`build_with_value_from_hash`) —
  trails stores `_ctes` pre-digested (`{ name, expression, recursive }`) where
  Rails keeps `with_values` as hashes and maps `build_with_value_from_hash`
  over them (query_methods.rb:1913-1921). Converging the store converges the
  row.
- `relation/query-methods.ts` `preprocess_order_args` (`flattened_args`) —
  the port calls the trails-only `flattenedOrderKeysForRawSqlCheck`, which
  drops hash VALUES; Rails' `flattened_args` (query_methods.rb:2077-2079)
  flattens `Hash#to_a`, so both key and direction reach `disallow_raw_sql!`.
  Behavioural: check `order(foo: :asc)` and `order("posts.id" => "asc")`
  against the adapter's `column_name_with_order_matcher` before switching.
- `relation/query-methods.ts` `build_order` (`compact_blank`) — ActiveSupport
  `compactBlank` exists, but trails' `Nodes::SqlLiteral` is not a String
  subclass (Rails' is), so `isBlank` does not drop a blank literal. Needs
  either a `SqlLiteral`-aware `isBlank` or a documented reason.
- `relation/query-methods.ts` `structurally_incompatible_values_for`
  (`reject`) — the port is a `for` loop over `STRUCTURAL_FIELDS` with a
  split-`:joins` special case; Rails is one `reject` over
  `STRUCTURAL_VALUE_METHODS` (query_methods.rb:2266-2277).
- `relation/query-methods.ts` `arel_column_with_table`
  (`order:quoteTableName,sql`) — Rails' first `Arel.sql` is
  `self.references_values |= [Arel.sql(table_name, retryable: true)]`
  (query_methods.rb:1979); trails stores `_referencesValues` as bare strings
  and only auto-derived SqlLiteral references seed JoinDependency's alias map
  (see the host-interface comment in `relation/query-methods.ts`). Converging
  the store retires the row.

- `relation/calculations.ts` `type_cast_pluck_values` count-mismatch branch —
  when `result.columns.size != columns.size` Rails passes `model.attribute_types`
  wholesale (calculations.rb:609-610); the port instead builds a per-column
  `overrides` map through `pluckCastTypeForKnownColumn`. Raised as an
  out-of-scope observation on PR #6587 (which converged the OTHER branch of the
  same method) and left untouched there. No baseline row names it today —
  converging it is fidelity work, not row burndown.

## Acceptance criteria

- [ ] `execute_grouped_calculation` ports calculations.rb:512-586 directly;
      `groupedAggregate` is gone or reduced to what Rails actually extracts.
- [ ] Each remaining row above either converges or carries a reviewed
      one-line reason / `@missingRailsCall` at the call site.
- [ ] Rows deleted by hand from their shards; stale marks fixed with
      `pnpm parity:api:calls:tighten <shard>`. No `--write`, no reseed.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green;
      in-scope row count falls.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.

## Notes

Ship in more than one PR if it does not fit the LOC ceiling; file the
remainder as a further story rather than fanning out sibling PRs.
