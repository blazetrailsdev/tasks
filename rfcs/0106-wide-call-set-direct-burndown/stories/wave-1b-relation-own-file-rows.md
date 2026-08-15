---
title: "Wave 1b: relation.ts — the 43 rows Rails defines in relation.rb itself"
status: done
updated: 2026-08-15
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 350
priority: null
pr: 6562
claim: "2026-08-15T12:45:04Z"
assignee: "index-name-exists-returns-index"
blocked-by: null
closed-reason: null
---

## Context

Slice 2 of the `relation.ts` burndown opened by `wave-1-relation-ts` (PR #6558),
which converged 8 of the original 117 rows and measured the rest. 109 rows
remain in `scripts/api-compare/call-mismatches-exclude/activerecord/relation.json`
at `kind: "set"`; this story owns the **43 rows whose method Rails defines in
`relation.rb` itself**.

Measured 2026-08-15 after #6558 merged, by grouping the shard's rows on
`rubyName` and locating each Ruby method by `def` under
`vendor/rails/activerecord/lib/active_record/`.

Methods in this slice (43 rows):

    _substitute_values, cache_key, compute_cache_key, compute_cache_version,
    create!, create_or_find_by, delete_all, exec_explain, exec_main_query,
    exec_queries, first_or_initialize, instantiate_records, load_async, pluck,
    references_eager_loaded_tables?, scope_for_create, to_sql, update_all,
    update_counters, values_for_queries

The frequency head inside the slice is `with_connection` (~12 rows across
`compute_cache_version`, `create_or_find_by`, `delete_all`, `exec_explain`,
`exec_main_query`, `load_async`, `pluck`, `to_sql`, `update_all`), which is the
pool-checkout divergence — coordinate with RFC 0073 rather than converging it
here row by row.

Two rows in this slice are already owned elsewhere and must NOT be converged here:

- `_substitute_values` -> `build_bind_attribute` is blocked on
  [[query-attribute-type-cast-is-a-no-op]] / `converge-query-attribute-type-cast-to-rails-no-op`:
  Rails casts exactly once (`predicate_builder.rb:67-69` hands an already-cast
  value to `QueryAttribute.new`, whose `type_cast` is identity —
  `query_attribute.rb:22-24`), but trails' `QueryAttribute#typeCast` casts its
  input, so routing through `buildBindAttribute` double-casts.
- `exec_queries` / `exec_main_query` are dead code in trails (the live path is
  `Relation#toArray` -> `_toArrayInner`), owned by
  [[port-relation-exec-queries-as-one-method]].

## Rule for this file

Never act on a call name alone. `compare.ts:177-188` documents why the
enumerable/predicate names are deliberately not suppressed: on an Array `first`
/ `last` / `size` / `include?` are plain JS idioms, on a Relation they are
query-triggering methods. Join to the Ruby call site via
`scripts/api-compare/output/rails-api.json` and split by receiver before writing
any shared reason.

## Acceptance criteria

- [ ] Every row converged is converged because the TS body now makes the call
      Rails makes, verified against the Ruby body.
- [ ] Rows deleted **by hand** from the shard (via `serializeBaseline`), then
      `pnpm parity:api:calls:tighten activerecord/relation.json`. No `--write`,
      no reseed.
- [ ] Any row that cannot converge carries a reviewed one-line reason or a
      `@missingRailsCall` tag at the call site.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
