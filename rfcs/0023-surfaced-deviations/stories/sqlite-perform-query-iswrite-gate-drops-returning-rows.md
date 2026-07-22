---
title: "sqlite-perform-query-iswrite-gate-drops-returning-rows"
status: ready
updated: 2026-07-22
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`performQuery` in
`packages/activerecord/src/connection-adapters/sqlite3/database-statements.ts`
(the body wired as `_performQuery` in `sqlite3-adapter.ts:508`, backing both
`execute` at `:470` and `executeMutation` at `:629`) gates row-returning on:

```ts
if (stmt.reader && !isWrite) { rows = await stmt.all(...) } else { ... rows = [] }
```

Rails' `perform_query`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3/database_statements.rb:79-112`)
branches on `stmt.column_count.zero?` ALONE — there is no write predicate in
the branch. The `!isWrite` conjunct is a trails invention.

Consequence: `INSERT/UPDATE/DELETE ... RETURNING` is a write, so it always
takes the `.run()` branch and `execute()` returns `[]` instead of the RETURNING
rows — on EVERY driver, including better-sqlite3. Verified locally: an
adapter-level `execute("INSERT ... RETURNING id, name")` returns `[]` on
better-sqlite3, libsql and node-sqlite alike.

PR #4979 fixed the adjacent driver-level half (`SqliteStatement#reader` was
regex-derived on node-sqlite/expo and misclassified RETURNING); with that
merged, `internalExecQuery` — which has no isWrite gate — returns RETURNING
rows correctly on all drivers. Only the `_performQuery` gate remains.

## Why this was split out

Removing the `!isWrite` conjunct is NOT a one-line change. The gate exists so
writes take `.run()`, whose `RunResult` supplies `changes` / `lastInsertRowid`
ATOMICALLY — PR #4893 introduced this specifically because a separate awaited
`SELECT last_insert_rowid()` races under `Promise.all` (see the comment block
in `performQuery`). `executeMutation` returns `Number(insertRowid)` for a
single-column `INSERT ... RETURNING id`, so routing that to `.all()` loses the
rowid and would regress #4893.

Rails does not have this problem: it reads `raw_connection.changes` post-hoc
and is single-threaded per connection.

## Acceptance criteria

- [ ] `_performQuery` branches on the statement's column count alone, matching
      Rails' `column_count.zero?`, so `execute("INSERT ... RETURNING ...")`
      yields the returned rows on better-sqlite3, libsql and node-sqlite.
- [ ] `executeMutation`'s affected-rows and insert-rowid return values stay
      correct AND race-free for RETURNING writes — do not reintroduce a
      separate awaited `last_insert_rowid()` readback. Likely needs a
      connection-level `changes` / `lastInsertRowid` accessor on
      `SqliteConnection` (`sqlite-adapter.ts`), which currently exposes
      neither.
- [ ] Re-enable the adapter-level `execute` assertion removed from
      `packages/activerecord/src/sqlite/statement-reader.test.ts` by #4979
      (see the comment above the `describe.each(adapters)` block naming this
      story), parameterized across drivers.
- [ ] Concurrency coverage: parallel `Promise.all` inserts still return
      distinct, correct ids.
