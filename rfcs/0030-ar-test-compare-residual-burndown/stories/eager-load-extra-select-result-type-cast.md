---
title: "eager-load-extra-select-result-type-cast"
status: in-progress
updated: 2026-06-20
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 3707
claim: "2026-06-20T03:26:45Z"
assignee: "eager-load-extra-select-result-type-cast"
blocked-by: null
---

## Context

Surfaced by RFC 0030 story `eager-load-extra-select-projection` (PR #3520).
That PR made a relation's explicit `select` survive eager loading and hydrate
onto the base record, e.g.
`Post.select("posts.id * 1.1 AS foo").eagerLoad("comments")` now lands `foo`.

Rails additionally **type-casts** the extra select value using the result
set's `column_types` (join_dependency.rb:118–132 —
`column_types = result_set.column_types ...; column_aliases += column_names.map
{ |name| Aliases::Column.new(name, name) }`, then
`join_root.instantiate(row_hash, column_aliases, column_types)`). So
`posts.first.foo == 1.1` (Float) on every adapter.

trails does NOT cast arbitrary computed select columns by their DB result
type. This is adapter-wide, not eager-specific:

- `Result.toArray()` returns raw hash rows (no per-value cast);
  `Model._instantiate` only casts **known** attributes, and `foo` is not a
  schema column.
- The MySQL adapter's `castResult`
  (`connection-adapters/mysql2/database-statements.ts:202`) builds
  `new Result(columns, rows)` with **no** `columnTypes`, so there is no type
  info to deserialize with. PostgreSQL is similar.
- SQLite happens to return a JS number, so the value is "right" there by luck;
  MySQL/PG return the string `"1.1"`.

Because of this gap, the un-skipped test
`relation/select.test.ts > type casted extra select with eager loading`
asserts `Number(post.readAttribute("foo")) === 1.1` rather than Rails'
`post.foo === 1.1`. Convergence = make trails cast extra/computed select
columns by the result column type so the bare `=== 1.1` assertion holds on all
adapters.

## Acceptance criteria

- [ ] Adapters report result `column_types` for computed/aliased select columns
      (at least enough to cast numeric/decimal expressions), or an equivalent
      mechanism casts extra select columns at instantiation time.
- [ ] Extra (non-`t#_r#`) select columns are type-cast on both the eager-load
      and the plain relation load paths, mirroring Rails'
      `result_set.column_types` slice in JoinDependency#instantiate.
- [ ] Tighten `type casted extra select with eager loading` to assert
      `post.readAttribute("foo") === 1.1` (drop the `Number(...)` coercion) and
      keep it green on SQLite, PostgreSQL, and MySQL.
- [ ] No regressions in existing select / eager-load hydration tests.
