---
title: "Widen AddForeignKeyOptions column/primaryKey to string|string[]"
status: ready
updated: 2026-07-07
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`AddForeignKeyOptions` (packages/activerecord/src/connection-adapters/abstract/schema-definitions.ts:105-114)
types `column?: string` and `primaryKey?: string` — scalar only. But Rails'
`add_foreign_key` / `foreign_key_options` (schema_statements.rb:1246-1267)
accept composite **arrays**: `primary_key: [...]` maps each PK column through
`foreign_key_column_for` to build a composite `column` array, and
`ForeignKeyDefinition` already models `column: string | string[]` /
`primaryKey: string | string[]`.

Surfaced in PR #4716 (newForeignKeyDefinition convergence): the runtime paths
(`SchemaStatements#foreignKeyOptions` and the `newForeignKeyDefinition`
bare-adapter fallback) both correctly handle the array branch, but the public
DSL type is scalar, so a well-typed caller cannot pass a composite key without a
cast — the composite-key regression test in
schema-definitions.test.ts had to cast `["tenant_id","id"] as unknown as string`.

## Acceptance criteria

- [ ] Widen `AddForeignKeyOptions.column` and `.primaryKey` to
      `string | string[]` (and `ReferenceForeignKeyOptions` by inheritance),
      matching Rails and the existing `ForeignKeyDefinition` field types.
- [ ] Remove the `as unknown as string` cast in the composite-key test in
      schema-definitions.test.ts once the type allows the array literal.
- [ ] Verify no downstream caller/consumer of `AddForeignKeyOptions` breaks
      under the widened type (migration.ts addForeignKey, schema-dumper,
      command-recorder, sqlite3/pg overrides).
- [ ] api:compare / test:compare delta non-negative; no test-name changes.
