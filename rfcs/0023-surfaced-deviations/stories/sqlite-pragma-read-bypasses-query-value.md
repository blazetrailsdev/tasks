---
title: "SQLite disable_referential_integrity reads pragmas via execute, not query_value"
status: draft
updated: 2026-07-29
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' SQLite `disable_referential_integrity` reads the two pragmas it restores
with `query_value`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:255-267`):

```ruby
old_foreign_keys = query_value("PRAGMA foreign_keys")
old_defer_foreign_keys = query_value("PRAGMA defer_foreign_keys")
```

trails cannot use `queryValue` here. `query` routes through the adapter's
`internalExecQuery`, whose `!stmt.reader` branch returns `Result.empty()` for a
`PRAGMA` read, so `singleValueFromRows` receives no rows and the call blows up
with `Cannot read properties of undefined (reading '0')` — observed while
porting #5571.

The workaround in
`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts` reads the
values through `execute` and pulls the first value off the returned row hash:

```ts
const pragmaValue = async (sql: string): Promise<unknown> =>
  Object.values((await this.execute(sql))[0] ?? {})[0];
```

Both statements stay instrumented (which is what makes the alter_table rebuild
count 14 queries, per `columns_test.rb:411`), so behaviour matches; only the
call shape diverges. The divergence is recorded as a live wide-call ratchet
entry — `activerecord  connection-adapters/sqlite3-adapter.ts
disable_referential_integrity  query_value` — and a local helper named
`queryValue` was deliberately renamed to `pragmaValue` so it would not falsely
satisfy that gate.

Root cause to fix: node:sqlite reports `reader === false` for `PRAGMA` reads
that do return rows, so `internalExecQuery` discards them. Fixing that unblocks
`queryValue` here and possibly other PRAGMA reads that currently bypass it.

## Acceptance criteria

- [ ] `internalExecQuery` returns the rows a `PRAGMA` read produces instead of
      `Result.empty()`, without changing behaviour for genuine non-reader
      statements.
- [ ] `disable_referential_integrity` uses `queryValue` for both reads, matching
      Rails' call shape; the local `pragmaValue` helper is removed.
- [ ] The `disable_referential_integrity  query_value` wide-call ratchet entry
      is removed as converged (hand-edit the exclude file, do not reseed).
- [ ] `columns.test.ts`'s two `assertQueriesCount` cases still see 14 statements
      on SQLite.
- [ ] Green on all three lanes.
