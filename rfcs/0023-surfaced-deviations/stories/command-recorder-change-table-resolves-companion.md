---
title: "CommandRecorder#changeTable must resolve updateTableDefinition on every adapter"
status: closed
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Already done: SchemaStatements#updateTableDefinition (connection-adapters/abstract/schema-statements.ts:1792) is mixed into AbstractAdapter and declared at abstract-adapter.ts:489, so CommandRecorder#changeTable resolves it on every adapter."
---

## Context

Surfaced by #5639 (`update-table-definition-single-home-per-adapter`).

`CommandRecorder#changeTable` resolves `updateTableDefinition` off the raw
connection (`packages/activerecord/src/migration/command-recorder.ts:120-136`):

```ts
const delegate = this._delegate as {
  supportsBulkAlter?(): boolean;
  updateTableDefinition(tableName: string, base: unknown): Table;
};
```

`_delegate` is the connection (`migration.ts:1138`, `migration.ts:1632` both pass
`this.connection`), mirroring Rails' `CommandRecorder#change_table`
(`vendor/rails/activerecord/lib/active_record/migration/command_recorder.rb:136`),
where `delegate.update_table_definition` resolves because every adapter
`include`s its `SchemaStatements` module.

In trails the module is a companion class reached via
`adapter.schemaStatements()`, and only `PostgreSQLAdapter` carries an
adapter-level forwarder (`postgresql-adapter.ts:4730`). `AbstractAdapter`,
`AbstractMysqlAdapter`/`Mysql2Adapter`, and `SQLite3Adapter` have no
`updateTableDefinition`, so a reverting migration whose body calls
`changeTable` throws `TypeError: delegate.updateTableDefinition is not a
function` on MySQL and SQLite. Not currently covered: `command-recorder.test.ts`
exercises this path only through hand-written fakes that supply the method
(`command-recorder.test.ts:8-18`), so the gap is invisible to the suite.

Two candidate shapes:

1. Have `CommandRecorder#changeTable` route through
   `delegate.schemaStatements().updateTableDefinition(...)` — the JS analogue of
   Ruby's `include`, one unconditional call, picks up the PG/MySQL companion
   overrides, and lets `postgresql-adapter.ts:4730` be deleted.
2. Put a delegating `updateTableDefinition` on `AbstractAdapter` forwarding to
   `this.schemaStatements()`, matching Rails' "every adapter has it via
   include" — but this adds surface to `abstract-adapter.ts`, whose Rails
   counterpart (`abstract_adapter.rb`) does not define the method, so check
   `parity:api:extra` before committing to it.

Prefer (1) unless parity:api evidence favors (2).

## Acceptance criteria

- `CommandRecorder#changeTable` resolves `updateTableDefinition` in a way that
  works on every adapter, with no optional probe and no per-adapter special
  casing.
- A reverting migration whose `change` body calls `changeTable` works on
  SQLite and MySQL, not just PostgreSQL — covered by a test driving a real
  adapter-backed `CommandRecorder`, not a fake delegate.
- If shape (1) is taken, the now-redundant `PostgreSQLAdapter#updateTableDefinition`
  forwarder is deleted; if shape (2), no duplicate definition survives on the
  adapter subclasses.
- `command-recorder.test.ts` fakes updated in step; test names unchanged.
- `parity:api` / `parity:test` deltas non-negative.
