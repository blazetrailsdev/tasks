---
title: "Wave 1b remainder: the 39 relation.rb-own call-set rows still baselined"
status: done
updated: 2026-08-15
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: 6563
claim: "2026-08-15T13:15:05Z"
assignee: "wave-1b-relation-own-file-rows-remainder"
blocked-by: null
closed-reason: null
---

# Wave 1b remainder: the 39 relation.rb-own rows still baselined

## Context

`wave-1b-relation-own-file-rows` owned 43 `kind: "set"` rows in
`scripts/api-compare/call-mismatches-exclude/activerecord/relation.json` whose
Ruby method Rails defines in `relation.rb` itself. Its PR converged 4 and hit
the LOC ceiling:

- `cache_key` -> `collection_cache_key` (relation.rb:438-441) — the memo now
  fills through `model.collectionCacheKey(this, timestampColumn)`, and
  `integration.ts`'s `collectionCacheKey` calls `computeCacheKey`
  (integration.rb:163-165) instead of recursing into `cacheKey`.
- `compute_cache_key` -> `cache_key` (relation.rb:445) — the key prefix is
  `model.modelName.cacheKey`, not `model.tableName`.
- `first_or_initialize` -> `first` (relation.rb:186-188) — `first || new(...)`.
- `values_for_queries` -> `except` (relation.rb:1286-1288).

39 rows remain in the slice. Excluded from it permanently (owned elsewhere,
see the parent story): `_substitute_values` -> `build_bind_attribute`
(query-attribute-type-cast-is-a-no-op), the `exec_queries` / `exec_main_query`
rows (port-relation-exec-queries-as-one-method), and every `with_connection`
row (RFC 0073 pool-checkout divergence).

That leaves these to converge here, each verified against the Ruby body first:

    compute_cache_version -> first, quote_column_name, to_fs, type_for_attribute
    create!               -> current_scope_restoring_block, scoping
    delete_all            -> arel, arel_columns, build_arel, order:primaryKey,applyJoinDependency
    exec_explain          -> render_bind
    instantiate_records   -> instantiate
    pluck                 -> all_attributes?, empty
    references_eager_loaded_tables? -> build_joins, order:map,flatMap
    scope_for_create      -> empty?
    to_sql                -> apply_join_dependency, arel
    update_all            -> arel, arel_columns, build_arel, sanitize_sql_for_assignment, sql
    update_counters       -> wrap

`update_counters` -> `wrap` is the trails-only `parseCounterCacheTouch` helper
standing in for Rails' inline `names = touch if touch != true; names =
Array.wrap(names); options = names.extract_options!` (relation.rb:935-941).
`references_eager_loaded_tables?` -> `build_joins` needs the real `build_joins([])`
call rather than the hand-rolled joined-table set (relation.rb:1474-1488).

## Rule for this file

Never act on a call name alone. `compare.ts:177-188` documents why the
enumerable/predicate names are deliberately not suppressed. Join to the Ruby
call site via `scripts/api-compare/output/rails-api.json` and split by receiver
before writing any shared reason.

## Acceptance criteria

- [ ] Every row converged is converged because the TS body now makes the call
      Rails makes, verified against the Ruby body.
- [ ] Rows deleted by hand from the shard (via `serializeBaseline`), then
      `pnpm parity:api:calls:tighten activerecord/relation.json`. No `--write`,
      no reseed.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
