---
title: "MySQL indexes is public in Rails but tagged @internal, so parity:api never sees it"
status: done
updated: 2026-08-10
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 15
priority: null
pr: 6321
claim: "2026-08-10T02:26:38Z"
assignee: "port-test-date-arith-iteration"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in PR #6300, which moved MySQL `indexes` off a module-level
`this`-typed function invoked through an `IndexesHost` shim and onto
`MysqlSchemaStatements` as a real adapter method.

The JSDoc block moved with the body, and it still opens with `@internal`
(`packages/activerecord/src/connection-adapters/mysql/schema-statements.ts:35`):

```ts
  /** @internal
   * Return user-defined indexes for the given table. Mirrors Rails'
   ...
   * Mirrors: ActiveRecord::ConnectionAdapters::MySQL::SchemaStatements#indexes
   */
  async indexes(tableName: string): Promise<IndexDefinition[]> {
```

That tag was correct while the function was a shim helper — it was not itself
the Rails method. It is wrong now. Rails' `indexes` is **public**:
`vendor/rails/activerecord/lib/active_record/connection_adapters/mysql/schema_statements.rb:8`
sits above the `private` keyword at `:143` (contrast `add_index_length` at
`:229` and `add_options_for_index_columns` at `:236`, which are below it and
whose `@internal` tags in the same file are correct).

`@internal` drops a member from the compared surface, so a public Rails method
that trails does implement is currently invisible to `parity:api` — it takes
no credit for it and cannot flag drift in it. The neighbouring public members in
the same class (`schemaCreation`, `updateTableDefinition`, `createTable`,
`removeColumn`, `dropTable`, `indexes`) carry a plain `Mirrors:` line and no
tag; `indexes` is the only public one that does not.

## Converged shape

Drop the `@internal` tag from `indexes`' JSDoc, keeping the prose and the
`Mirrors:` line. Leave `addIndexLength` and `addOptionsForIndexColumns` tagged
— those two are genuinely private in Rails.

Confirm the method is credited afterwards rather than newly-flagged: a body
compared for the first time can surface pre-existing call-set rows
(`pnpm parity:api:calls`), which are baselined with a real reason, never reverted.

## Acceptance criteria

- [ ] `MysqlSchemaStatements#indexes` has no `@internal` tag and matches
      `mysql/schema_statements.rb:8`'s public visibility.
- [ ] `addIndexLength` / `addOptionsForIndexColumns` keep theirs
      (`schema_statements.rb:229,236`, below `private` at `:143`).
- [ ] `pnpm parity:api` delta non-negative; `pnpm parity:api:calls` clean (any newly
      surfaced row carries a reviewed one-line reason).
