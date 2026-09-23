---
title: "sqlite3-configure-connection-pragma-host-literal-not-raw-connection"
status: in-progress
updated: 2026-09-23
rfc: "0094-sqlite3-adapter-construction-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: trails#7993
claim: "2026-09-23T01:29:49Z"
assignee: "libsql-remote-adapter-spoofs-file-prefix-through-initialize"
blocked-by: null
closed-reason: null
---

## Context

`SQLite3Adapter#configureConnection`
(`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts:1505-1509`)
calls each `Pragmas` setter as
`Pragmas[setter].call({ execute: (sql) => this._rawConnection!.exec(sql) }, value)`.
Rails calls `@raw_connection.public_send("#{pragma}=", value)`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:838-844`).
The receiver is an `SQLite3::Database`, which includes `Pragmas`
(`vendor/sqlite3/lib/sqlite3/database.rb:89`) and defines `execute` itself
(`:247`). Trails' `SqliteConnection` (`sqlite-adapter.ts:30-39`) exposes only
`exec` / `pragma`, so an object literal stands in for the Database.

The deviation carries no baseline row and no `@noRailsEquivalent` /
`@missingRailsArgs` receipt — it is undeclared debt, not registered debt.

### Only one of the two routes reaches the call site

The original acceptance criteria offered "`SqliteConnection` gains `execute`,
**or** mixes in `Pragmas`". The second arm has since gone stale and does not
work:

- #7966 created `packages/activerecord/src/sqlite/database.ts` to port
  `SQLite3::Database.quote`, so `include Pragmas` at `database.rb:89` now has
  an obvious home. But nothing instantiates trails' `Database` — it is a
  statics-only holder that `connection-adapters/sqlite3/quoting.ts:21` imports
  for `quote`, and the `new Database(...)` calls in `sqlite/better-sqlite3.ts`
  and `sqlite/libsql.ts` are the _driver packages'_ own classes. Mixing
  `Pragmas` into it would be faithful to line 89 and would leave the host
  literal exactly where it is.
- The runtime receiver is whichever driver binding implements
  `SqliteConnection` (`sqlite/better-sqlite3.ts`, `sqlite/node-sqlite.ts`,
  `sqlite/libsql.ts`, `sqlite/expo-sqlite.ts`). `SqliteConnection` is trails'
  stand-in for `SQLite3::Database`, so the gem's `Database` API belongs on it.

So the work is: add `execute(sql)` to the `SqliteConnection` interface and
implement it in the four bindings.

### Port `execute` row-returning

The gem's `Database#execute` (`database.rb:247-259`) **returns rows**.
`sqlite/pragmas.ts` has so far ported only the setters, which discard the
return, so a void `execute` delegating to `exec` would satisfy the criteria
below and still be a half-port. The getters — `get_boolean_pragma`
(`vendor/sqlite3/lib/sqlite3/pragmas.rb:11`), `get_query_pragma` (`:41`),
`get_enum_pragma` (`:51`), `get_int_pragma` (`:69`) — are all unported and all
read `execute`'s rows. Port `execute` row-returning the first time rather than
leaving that widening to whoever lands them.

### Extra-surface note

`sqlite3` is an api-compared package rooted at `packages/activerecord/src/sqlite/`
(`scripts/api-compare/config.ts:46,109`), so `sqlite/database.ts` and
`sqlite/pragmas.ts` are measured against the gem. `sqlite-adapter.ts` sits
_outside_ that root, in the `activerecord` population, where Rails has no
`sqlite_adapter.rb` to match it — so the file is unmatched and `SqliteConnection`
is unscored. Confirm that before adding the interface member: `activerecord` is
rowless (0/0) under `parity:api:extra:gate`, so if the file does turn out to be
matched, a new public name reds the gate.

Relocating `SqliteConnection` into `src/sqlite/`, where the gem's `Database`
mirror lives, is the larger structural question. It is **not** in scope here;
file it separately if this work makes the case.

## Acceptance criteria

- [ ] `SqliteConnection` (`sqlite-adapter.ts`) declares `execute(sql)`, returning
      rows as `Database#execute` does, and all four bindings implement it.
- [ ] `configureConnection` calls the `Pragmas` setter with `this._rawConnection`
      as the receiver; no ad-hoc `{ execute }` host literal remains.
- [ ] `SyncSqliteConnection` stays in step with `SqliteConnection`.
