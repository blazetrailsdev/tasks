---
title: "TableDefinition#primaryKeys is a derived reader, not Rails' PrimaryKeyDefinition setter"
status: done
updated: 2026-08-03
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 5981
claim: "2026-08-03T14:52:47Z"
assignee: "table-definition-primary-keys-is-a-reader-not-rails-setter"
blocked-by: null
closed-reason: null
---

## Context

Rails' `TableDefinition#primary_keys` is a **setter/reader pair**: passing a
name stores a `PrimaryKeyDefinition`, and the bare call returns it
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_definitions.rb:412-415`).
`SchemaCreation` reads that stored object to emit the composite
`PRIMARY KEY (...)` clause (`schema_creation.rb:51,79`).

trails' `primaryKeys` is a **derived reader only** — it filters
`this.columns` for `options.primaryKey`
(`packages/activerecord/src/connection-adapters/abstract/schema-definitions.ts:1069-1075`).
There is no way to set a composite PK on an existing definition.

Consequence: Rails' `copy_table` does
`@definition.primary_keys from_primary_key` _inside_ the `create_table` block
(`sqlite3_adapter.rb:602-606`), which cannot be ported. PR #5613 instead passes
the composite PK through the `primaryKey` **constructor option** — same emitted
SQL for the cases we exercise, but the wrong mechanism, and it means the
composite PK must be known before the definition exists. `alterTable` has the
same workaround
(`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts:2331-2335`).

`copy_table → primary_keys` sits in the wide call-mismatch baseline at
`scripts/api-compare/call-mismatches-wide-exclude/activerecord/connection-adapters/sqlite3-adapter.json`
because of this.

## Acceptance criteria

- [ ] `TableDefinition#primaryKeys(name)` stores a `PrimaryKeyDefinition` when
      given a name and returns it when called bare, per
      `schema_definitions.rb:412-415`.
- [ ] `SchemaCreation` emits the composite `PRIMARY KEY (...)` clause from the
      stored object, per `schema_creation.rb:51,79`.
- [ ] sqlite `copyTable` calls `definition.primaryKeys(fromPrimaryKey)` inside
      the `createTable` block instead of pre-computing the `primaryKey` option.
- [ ] Remove the `copy_table → primary_keys` wide-gate baseline entry.
- [ ] Composite-PK schema dumps and rebuilds unchanged on all three adapters.
- The wide call-set ratchet entry for this defect is removed: `connection-adapters/sqlite3-adapter.ts`
  / `copy_table` / `primary_keys → primaryKeys`. Reseed with
  `pnpm tsx scripts/api-compare/lint-call-mismatches-wide.ts --write` and commit
  the shrunk baseline. (Cross-referenced by the RFC 0084 survey, 2026-07-30 —
  one of 8 open fidelity stories whose actual defect the wide gate can see.)
