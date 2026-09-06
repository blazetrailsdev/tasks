---
title: "SchemaStatements re-implements JoinTable instead of mixing it in"
status: claimed
updated: 2026-09-05
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-09-05T23:06:51Z"
assignee: "converge-hash-config-configuration-alias"
blocked-by: null
closed-reason: null
---

## Context

Rails defines `find_join_table_name` and `join_table_name` **once**, as private
methods of `ActiveRecord::Migration::JoinTable`
(`vendor/rails/activerecord/lib/active_record/migration/join_table.rb:7-13`),
and mixes that module into its consumers:

- `vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:9`
  — `include ActiveRecord::Migration::JoinTable`
- `vendor/rails/activerecord/lib/active_record/migration/command_recorder.rb`
  — same include

trails has the module at `packages/activerecord/src/migration/join-table.ts`
(exported `findJoinTableName` / `joinTableName`), but
`packages/activerecord/src/connection-adapters/abstract/schema-statements.ts`
does **not** mix it in. `joinTableName` (schema-statements.ts:2010) delegates to
the imported `_joinTableName`, while `findJoinTableName` (schema-statements.ts:2008)
carries a **second, independent copy of the body**:

```ts
findJoinTableName(table1, table2, options = {}): string {
  const tableName = options.tableName;
  delete options.tableName;
  return tableName ?? this.joinTableName(table1, table2);
}
```

`command-recorder.ts:664` does it correctly — it delegates to
`_findJoinTableName`.

This duplication is not cosmetic: it already caused a shipped behavioural
divergence. The adapter copy read `options.tableName` without deleting it, so
`createJoinTable(..., { tableName: "catalog" })` leaked the key into
`createTable`'s options and raised `Unknown key: :tableName` out of
`validateCreateTableOptionsBang`, while the join-table.ts copy — and its
`join-table.trails.test.ts` coverage — was correct the whole time. PR #7254 fixed
the adapter copy by hand; the two bodies can drift again tomorrow.

## Converged shape

Delete both hand-written bodies from `SchemaStatements` and mix the module in
the settled trails way (CLAUDE.md "Module mixins"): assign the imported
`this`-typed functions to the class, or `include()` the module, so there is one
definition at the Rails file and the Rails name, exactly as
`schema_statements.rb:9` gets it from the `include`. `joinTableName`'s
delegating wrapper goes too — Rails has no wrapper there.

Note the module-init constraint recorded on the (done) story
`migration-join-table-delegate-to-derive-join-table-name`: `join-table.ts` is
deliberately a leaf in the adapter import graph
(`scripts/test-deps/adapter-graph-import-tdz.test.ts`). schema-statements.ts
already imports from it (`schema-statements.ts:2`), so pulling
`findJoinTableName` across the same edge adds no new module edge.

`@internal` is correct on both (Rails has them under `private`), and
`eslint/rails-private-methods.json` already records that.

## Acceptance criteria

- `SchemaStatements` has no hand-written `findJoinTableName` / `joinTableName`
  body; both come from `migration/join-table.ts` via the mixin idiom.
- `createJoinTable`, `dropJoinTable`, `buildCreateJoinTableDefinition`
  (schema-statements.ts:734, :751, :1119) still resolve them, and
  `create-join-table.test.ts` (all 20 ported Rails tests) stays green on all
  three adapters.
- `join-table.trails.test.ts` and
  `schema-statements-privates.trails.test.ts:390` stay green.
- `pnpm parity:api:calls`, `pnpm parity:api:calls:args`, and
  `pnpm parity:api:extra:gate` stay green;
  `scripts/test-deps/adapter-graph-import-tdz.test.ts` stays green.
