---
title: "sqlite3 binding getFirstValue materializes every row instead of stepping one"
status: draft
updated: 2026-09-23
rfc: "0094-sqlite3-adapter-construction-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The gem's `Database#get_first_value` (`vendor/sqlite3/lib/sqlite3/database.rb:377-384`)
reads a single row: it opens `query(sql, bind_vars)`, steps once with `rs.next`,
and returns `row[rs.columns[0]]` (hash mode) or `nil` without reading the rest.

trails#7996 added `getFirstValue` to the four bindings
(`packages/activerecord/src/sqlite/{better-sqlite3,node-sqlite,libsql,expo-sqlite}.ts`)
as `this.execute(sql, bindVars)[0]` followed by `Object.values(row)[0]`. That
reads every row and takes the first value by key order, not by
`columns[0]`.

The obstacle is that `Statement#iterate`, the one-row-stepping primitive, throws
on a statement that returns no rows in better-sqlite3 and libsql. The gem's
`rs.next` returns `nil` there. `BetterSqlite3Statement#all` already covers the
same gap for `to_a` (trails#7993). Also, expo-sqlite's `columns()` returns `[]`,
so `rs.columns[0]` has no source there.

## Converged shape

- Each binding steps only the first row, as `rs.next` does, and returns `null`
  for a statement that returns no rows instead of throwing.
- The value is read by the first column's name, as `rs.columns[0]` does.
  For example, give `iterate` the no-row handling that `all` has, and make expo's
  `columns()` real.

## Acceptance criteria

- [ ] `getFirstValue` never materializes rows past the first on any binding.
- [ ] A statement that returns no rows answers `null` on all four bindings.
- [ ] The value comes from the first column by name, not from object key order.
