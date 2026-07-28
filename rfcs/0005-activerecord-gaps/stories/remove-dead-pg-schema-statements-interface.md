---
title: "remove-dead-pg-schema-statements-interface"
status: in-progress
updated: 2026-07-28
rfc: "0005-activerecord-gaps"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5510
claim: "2026-07-28T14:31:43Z"
assignee: "remove-dead-pg-schema-statements-interface"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/connection-adapters/postgresql/schema-statements.ts:47-373`
declares `export interface SchemaStatements` — a ~327-line structural mirror of
the PG schema-statements surface that **nothing imports**. The only consumers of
that module take `CreateDatabaseOptions` and `PgIndexDefinition`:

- `connection-adapters/postgresql-adapter.ts:106`
- `connection-adapters/postgresql/schema-statements-class.ts:22`

The live contract is the class: `PostgreSQLSchemaStatements extends
SchemaStatements` (`postgresql/schema-statements-class.ts:97`) where
`SchemaStatements` is the **abstract class** from
`connection-adapters/abstract/schema-statements.js` — a different symbol that
merely shares the name. Rails has no interface counterpart either:
`ActiveRecord::ConnectionAdapters::PostgreSQL::SchemaStatements`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/schema_statements.rb`)
is a module mixed into the adapter, which trails already models as the class.

Because it is unenforced, it has silently drifted from the implementation.
Found during review of #5501, which widened
`PostgreSQLAdapter#validateForeignKey` and `Migration#validateForeignKey` to
`Omit<ForeignKeyLookupOptions, "toTable">` to match what
`postgresql/schema-statements-class.ts:1107` actually accepts. The dead
interface still declares the pre-widening two-arg shapes, matching neither the
class nor the adapter:

- `schema-statements.ts:102` — `validateForeignKey(tableName: string, name: string)`
  vs the real `(fromTable: string, toTable?: string, options?: ForeignKeyLookupOptions)`
- `schema-statements.ts:101` — `validateCheckConstraint(tableName: string, name: string)`
  vs the real `(tableName: string, nameOrOptions: string | { name: string; expression?: string })`

Those two are the ones review caught; the rest of the interface has not been
audited and may carry further drift.

Not fixed in #5501: deleting the interface plus its now-unused type imports is
~330 deletions, which would push that PR (181/4 at review time) past the 500-LOC
ceiling. Widening just the two drifting signatures in place was rejected as
worse — it would make a dead, unenforced interface look like a maintained
contract.

## Acceptance criteria

- [ ] `export interface SchemaStatements` is deleted from
      `connection-adapters/postgresql/schema-statements.ts`, along with the
      top-of-file type imports that only it used (`AddForeignKeyOptions`,
      `ChangeColumnDefinition`, `ChangeColumnDefaultDefinition`,
      `CheckConstraintDefinition`, `ForeignKeyDefinition`, `IndexDefinition`,
      `ExclusionConstraintDefinition`, `UniqueConstraintDefinition` — verify
      each is genuinely unused before removing).
- [ ] `CreateDatabaseOptions` and `PgIndexDefinition` stay exported; their two
      importers keep compiling.
- [ ] If any declaration in the interface turns out to describe behaviour the
      class does NOT implement, register that gap separately rather than
      preserving the declaration.
- [ ] `pnpm typecheck` clean; `pnpm api:compare` shows no new extra/missing
      surface.
- [ ] Green on all three adapters.
