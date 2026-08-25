---
title: "converge-query-method-stores-with-values-and-references"
status: done
updated: 2026-08-16
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6607
claim: "2026-08-16T19:13:32Z"
assignee: "converge-query-method-stores-with-values-and-references"
blocked-by: null
closed-reason: null
---

## Context

The `relation/query-methods.json` half of
`wave-2c-grouped-calculation-and-query-method-stores`, deferred there because
the PR hit its LOC ceiling on the `execute_grouped_calculation` port. Every row
below is live in
`scripts/api-compare/call-mismatches-exclude/activerecord/relation/query-methods.json`
today.

- `build_with` (`build_with_value_from_hash`) — trails stores `_ctes`
  pre-digested (`{ name, expression, recursive }`) where Rails keeps
  `with_values` as hashes and maps `build_with_value_from_hash` over them
  (query_methods.rb:1913-1921). Converging the store converges the row.
- `arel_column_with_table` (`order:quoteTableName,sql`) — Rails' first
  `Arel.sql` is
  `self.references_values |= [Arel.sql(table_name, retryable: true)]`
  (query_methods.rb:1979); trails stores `_referencesValues` as bare strings and
  only auto-derived SqlLiteral references seed JoinDependency's alias map (see
  the host-interface comment in `relation/query-methods.ts`). Converging the
  store retires the row.
- `preprocess_order_args` (`flattened_args`) — the port calls the trails-only
  `flattenedOrderKeysForRawSqlCheck`, which drops hash VALUES; Rails'
  `flattened_args` (query_methods.rb:2077-2079) flattens `Hash#to_a`, so both
  key and direction reach `disallow_raw_sql!`. Behavioural: check
  `order(foo: :asc)` and `order("posts.id" => "asc")` against the adapter's
  `column_name_with_order_matcher` before switching.
- `build_order` (`compact_blank`) — ActiveSupport `compactBlank` exists, but
  trails' `Nodes::SqlLiteral` is not a String subclass (Rails' is), so `isBlank`
  does not drop a blank literal. Needs either a `SqlLiteral`-aware `isBlank` or
  a documented reason.
- `structurally_incompatible_values_for` (`reject`) — the port
  (`relation/query-methods.ts:1124`) is a `for` loop over
  `STRUCTURAL_VALUE_METHODS` with a split-`:joins` special case; Rails is one
  `reject` (query_methods.rb:2266-2277). trails has no generic `reject`
  primitive today, so this needs one (ActiveSupport `Enumerable`) or a
  reviewed reason.

Also in scope, raised as an out-of-scope observation on PR #6587 and untouched
since (no baseline row names it): `type_cast_pluck_values`'s count-mismatch
branch. When `result.columns.size != columns.size` Rails passes
`model.attribute_types` wholesale (calculations.rb:609-610); the port instead
builds a per-column `overrides` map through `pluckCastTypeForKnownColumn`
(`relation/calculations.ts`).

## Acceptance criteria

- [ ] Each row above either converges or carries a reviewed one-line reason /
      `@missingRailsCall` at the call site.
- [ ] `type_cast_pluck_values`' count-mismatch branch is calculations.rb:609-610.
- [ ] Rows deleted by hand from their shards; stale marks fixed with
      `pnpm parity:api:calls:tighten <shard>`. No `--write`, no reseed.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green;
      in-scope row count falls.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
