---
title: "activerecord: sqlite3 type_cast and perform_query, PG reset and load_schema keep driver-shaped arms"
status: ready
updated: 2026-10-10
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Left from story `activerecord-arms-on-top-level-functions-the-skeleton-writer-newly-compares`. These
top-level ports are shaped by the npm driver under them and still differ from Rails' control flow:

- `typeCast` (`packages/activerecord/src/connection-adapters/sqlite3/quoting.ts`) against
  `vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/sqlite3/quoting.rb:112-126`:
  Rails switches on `BigDecimal, Rational` / `String` (re-encoding ASCII-8BIT); the port has nil,
  boolean, integer-to-`BigInt` and `BigDecimal` arms. Receipted `@inventedArm if`.
- `performQuery` (`sqlite3/database-statements.ts`) against `sqlite3/database_statements.rb`
  `perform_query`: the port rewrites `typeCastedBinds` for Float-typed bigint binds before Rails' body,
  and reads `lastInsertRowId`. Receipted `@inventedArm if`.
- `reset` (`packages/activerecord/src/pg/connection.ts`) against `vendor/pg/*/lib/pg/connection.rb`
  `reset`: the port wraps a node-pg reconnect in `try` / `catch` and omits the `iopts[:host]` arm.
  Receipted `@inventedArm try`, `rescue`, `throw`.
- `loadSchema` (`packages/activerecord/src/support/load-schema-helper.ts`) against
  `vendor/rails/v8.0.2/activerecord/test/support/load_schema_helper.rb:4-21`: Rails silences `$stdout`
  in a `begin` / `ensure` and loads the adapter-specific file `if File.exist?`. The port has neither
  arm; a missing arm has no receipt form, so it is listed here only.

## Acceptance criteria

- [ ] Each port takes Rails' arms, with the driver difference moved behind the gem-shaped client, or
      the arm is ruled permanent by the repo owner.
- [ ] Each `@inventedArm ... CONVERGEABLE` receipt naming this story is deleted.
