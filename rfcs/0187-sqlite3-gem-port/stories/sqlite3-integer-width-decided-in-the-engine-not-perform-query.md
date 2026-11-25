---
title: "SQLite integer width is decided in the engine, not in perform_query"
status: ready
updated: 2026-11-25
rfc: "0187-sqlite3-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails `perform_query` (`vendor/rails/v8.0.5.2/activerecord/lib/active_record/connection_adapters/sqlite3/database_statements.rb:77-112`) builds `ActiveRecord::Result.new(stmt.columns, stmt.to_a)` from a statement exactly as prepared. Ruby Integers are arbitrary-precision, so the gem never needs a per-statement bigint mode.

trails (`packages/activerecord/lib/connection-adapters/sqlite3/database-statements.ts`, `performQuery`) adds two steps Rails does not have, both receipted `@inventedArm ... PERMANENT`:

- `_maybeEnableReadBigInts`, which switches `Statement#setReadBigInts(true)` on when a column's decltype names `bigint`;
- `_narrowSpilledBigInts`, which maps bigints back to numbers when they fit in a safe integer.
  Both live in `packages/activerecord/lib/connection-adapters/sqlite3-adapter.ts`. This is RFC 0187 open question 3: where a JS engine's integer width is decided.

## Acceptance criteria

- [ ] Open question 3 is answered. The integer-width decision moves into the gem layer, so that a `Statement` hands back Ruby-Integer semantics: a number when the value is safe, a bigint otherwise, decided per value in the engine's column read.
- [ ] `performQuery` is `database_statements.rb:77-112` with no extra calls, and both `@inventedArm` receipts and the two adapter helpers are deleted.
- [ ] The existing bigint round-trip and narrowing trails tests pass unchanged (`sqlite3-adapter.bigint-narrowing.trails.test.ts`, the "SQLite3 bigint round-trip" test).
