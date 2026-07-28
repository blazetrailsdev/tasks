---
title: "Cover SchemaStatements#assumeMigratedUptoVersion, the production path"
status: ready
updated: 2026-07-28
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`SchemaStatements#assumeMigratedUptoVersion`
(`packages/activerecord/src/connection-adapters/abstract/schema-statements.ts:1843-1884`)
is the **production** path — `schema.ts:98` calls it, via
`pool.migrationContext`. It has **zero test coverage**: no `*.test.ts`
references `assumeMigratedUptoVersion` outside
`schema-migration.trails.test.ts`, which exercises only the standalone
`SchemaMigration` copy.

That is the exact gap PR #5483 closed on the other copy, where the absence of
coverage had let three separate Rails divergences ship unnoticed (duplicate-check
scope, `detect`/`count` selection, and single-vs-split INSERT with reversed
tuples).

Read against Rails, this implementation currently looks faithful — two
`execute` calls (`schema_statements.rb:1372-1374` then `:1381`), `inserting`
scoped as `(versions - migrated).select { |v| v < version }` (`:1375`),
`detect { |v| inserting.count(v) > 1 }` (`:1377`), and `_insertVersionsSql`
reverses the tuples (`:1882`). Nothing pins any of it, so the next refactor can
silently undo any of the three.

Note it also reaches the pool through an `(this.adapter as any).pool` cast and
falls back to a bare `"schema_migrations"` literal — worth confirming against
Rails' `pool.schema_migration.table_name` while writing the tests.

## Acceptance criteria

- [ ] Tests cover: no-op when already migrated, backfill of `v < version`,
      duplicate raise, and the `detect`/`count` selection with two distinct
      repeating values (`[B, A, A, B]` cites B).
- [ ] The emitted SQL is pinned for both statements, including the newline-joined
      tuples and trailing `;` that `insert_versions_sql` produces
      (`schema_statements.rb:1881-1884`) and the reversal.
- [ ] Each test fails against a deliberately broken variant, not just against
      current behavior.
- [ ] api:compare / test:compare delta non-negative.
