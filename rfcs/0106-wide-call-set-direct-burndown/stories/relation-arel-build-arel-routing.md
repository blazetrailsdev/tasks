---
title: "Route to_sql/delete_all/update_all/arel through build_arel and apply_join_dependency"
status: closed
updated: 2026-08-18
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 600
priority: 5
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Delivered by other merged work. On origin/main (a85bbef35) the trails-only _toSql/_buildArel/_compileSelectSql indirection is gone: buildArel is a real export in relation/query-methods.ts:3175 and relation.ts routes through it (toArel :1781, deleteAll :1508, updateAll :1435, with the eager arms calling applyJoinDependency). All the listed baseline rows except the two to_sql ones are gone from call-mismatches-exclude/activerecord/relation.json, which is down from 17 rows to 9; the surviving 'to_sql -> apply_join_dependency' and 'to_sql -> arel' rows carry reviewed RFC 0047 reasons ('Confirmed equivalent' / seeded baseline), not open work."
---

# Route `to_sql`, `delete_all`, `update_all` and `arel` through `build_arel` / `apply_join_dependency`

## Context

Surfaced finishing `wave-1b-relation-own-file-rows-remainder` (PR #6563),
which converged the cheap rows in
`scripts/api-compare/call-mismatches-exclude/activerecord/relation.json` and
left this cluster — it is one architectural change, not a set of independent
rows, and did not fit that PR's LOC ceiling.

Rows still baselined (`kind: "set"`), all in `activerecord/relation.json`:

    arel        -> build_arel
    to_sql      -> apply_join_dependency, arel
    delete_all  -> arel, arel_columns, build_arel, order:primaryKey,applyJoinDependency
    update_all  -> arel, arel_columns, build_arel, sanitize_sql_for_assignment, sql
    apply_join_dependency -> except, select_association_list, skip_query_cache_if_necessary
    in_batches  -> arel
    ids         -> arel_columns

(The `with_connection` rows on these same methods are RFC 0073 pool-checkout
divergence and are NOT in scope here.)

Rails:

- `Relation#arel` — `relation.rb:1176-1178`: `@arel ||= build_arel(...)`.
- `Relation#to_sql` — `relation.rb:1211-1221`: `if eager_loading?
... apply_join_dependency ...` then renders `arel`.
- `Relation#delete_all` — `relation.rb:1000-1030`.
- `Relation#update_all` — `relation.rb:850-900`, including
  `sanitize_sql_for_assignment`.
- `QueryMethods#build_arel` — `relation/query_methods.rb:1700+`.
- `Relation#apply_join_dependency` — `relation.rb:1400+`.

trails builds SQL through a parallel `_toSql` / `_buildArel` /
`_compileSelectSql` path in `packages/activerecord/src/relation.ts` rather
than through Rails' `arel` memo + `build_arel`, so none of these bodies make
the calls Rails makes.

## Converged shape

`arel()` memoizes `buildArel()`; `toSql`, `deleteAll`, `updateAll` and
`inBatches` read that memo, and the eager-loading arms call
`applyJoinDependency` the way Rails does. The trails-only `_toSql` /
`_buildArel` / `_compileSelectSql` indirection collapses into it.

## Acceptance criteria

- [ ] The listed rows are deleted by hand from
      `call-mismatches-exclude/activerecord/relation.json` (via
      `serializeBaseline`, no `--write`, no reseed), then
      `pnpm parity:api:calls:tighten activerecord/relation.json`.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
- [ ] Likely needs splitting across more than one PR — if so, ship the first
      slice and file the rest rather than exceeding the ceiling.
