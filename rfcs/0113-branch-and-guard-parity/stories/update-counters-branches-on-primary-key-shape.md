---
title: "update_counters branches on the primary key's shape where Rails has one where! call"
status: ready
updated: 2026-09-06
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: 51
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced converging `update-counters-drops-the-composite-key-guard` on PR #7287.

Rails' `CounterCache::ClassMethods#update_counters`
(`vendor/rails/activerecord/lib/active_record/counter_cache.rb:117`) reaches the
relation with **one** unconditional call, whatever the primary key's shape:

```ruby
unscoped.where!(primary_key => id)
```

A Ruby Hash takes the Array a composite primary key is as its key, and
`build_where_clause` handles that key
(`relation/query_methods.rb:1631-1636`, `Hash#transform_keys`). A JS object
literal cannot, so the port branches on the key's shape
(`packages/activerecord/src/counter-cache.ts`):

```ts
const relation = Array.isArray(primaryKey)
  ? unscoped.whereBang(primaryKey, id)
  : unscoped.whereBang({ [primaryKey]: id });
```

Both arms are on Rails' bang call, and the positional `(cols, tuples)` form is
pre-existing rather than invented — PR #7287 only relocated it out of `where`
and into `where!` — but the branch itself is an arm Rails does not have, and it
is the single residual row this file keeps in
`pnpm parity:api:arms:report` (`counter-cache.ts#updateCounters count +if`).

The same shape appears in `resetCounters` (`counter_cache.rb:69`, non-bang
`where`) and in `FinderMethods#find_one`
(`packages/activerecord/src/relation/finder-methods.ts:739-741`), so converging
it retires a repeated deviation rather than a local one.

## Converged shape

`build_where_clause` / `buildWhereClause`
(`packages/activerecord/src/relation/query-methods.ts`) accepts a
composite key the way Ruby's Hash does, so one `where!` call serves both PK
shapes and the ternary disappears. A JS `Map` keyed by the column-name array is
the obvious carrier — Ruby's Hash key is an Array, and `Map` is the JS
collection whose keys are not restricted to strings — but the mechanism is open:
what the story fixes is that callers must not branch on `primaryKey`'s shape.

Note the empty-tuple case answers `none!`, not a where clause
(`query-methods.ts`, `whereBang`), which is why the positional form lives in
`where!` today rather than in `buildWhereClause`; a converged
`buildWhereClause` has to answer that case some other way.

## Acceptance criteria

- [ ] `updateCounters` is Rails' one line: `unscoped.where!(primaryKey => id)`,
      with no branch on the primary key's shape.
- [ ] `resetCounters` likewise reduces to `counter_cache.rb:69`'s single
      non-bang `where`.
- [ ] The `counter-cache.ts#updateCounters` row leaves
      `pnpm parity:api:arms:report`.
- [ ] The Rails-named composite-PK counter tests
      (`counter_cache_test.rb:53,60,79,175,215`) stay green, and still regress
      if the `composite_primary_key?` guard line is removed.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
