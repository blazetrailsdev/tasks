---
title: "Migration DDL routes through this.schema, hiding adapter overrides"
status: draft
updated: 2026-07-29
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Migration#changeColumnNull` was routing DDL through `this.schema` (a
`SchemaStatements` instance built at `packages/activerecord/src/migration.ts:336-344`)
rather than through the connection. That reached the abstract
`ALTER COLUMN ... SET NOT NULL` at
`packages/activerecord/src/connection-adapters/abstract/schema-statements.ts:697-712`,
which SQLite has no syntax for, leaving `BetterSQLite3Adapter.changeColumnNull`
(`connection-adapters/sqlite3-adapter.ts:1766-1784`, the table-rebuild path)
unreachable from any migration. PR #5547 fixed that one method by forwarding to
`this.connection`, matching Rails, where `Migration#method_missing` delegates to
the connection (`vendor/rails/activerecord/lib/active_record/migration.rb`,
`method_missing` / `connection.send(...)`).

Every other DDL method on `Migration` still routes via `this.schema`, so the
same class of bug is latent wherever an adapter overrides a schema-statement
that the abstract implementation also defines. `changeColumn`,
`changeColumnDefault` and `renameColumn` all have SQLite table-rebuild
overrides (`sqlite3-adapter.ts:1740-1810`) in exactly this shape.

## Acceptance criteria

- [ ] Audit every `this.schema.<method>(...)` call site in `migration.ts`
      against the adapter-level override set for sqlite3/mysql2/postgresql.
- [ ] Each method whose adapter override is currently unreachable from a
      migration forwards to `this.connection`, as Rails' `method_missing` does.
- [ ] A regression test per newly-reachable path that fails on baseline
      (the sqlite lane is the one that exposed this).
- [ ] No gate-mismatch or misplaced regression in
      `pnpm test:compare --package activerecord`.
