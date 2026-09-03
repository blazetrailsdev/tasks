---
title: "Move newColumnFromField, changeColumnForAlter, dataSourceSql and extractSchemaQualifiedName off postgresql-adapter.ts into the file that mirrors their Rails home"
status: done
updated: 2026-09-03
rfc: "0131-activemodel-activerecord-api-parity-100"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 280
priority: 3
pr: 7456
claim: "2026-09-03T19:46:04Z"
assignee: "move-postgresql-schema-statement-privates-to-their-rails-file"
blocked-by: null
closed-reason: null
---

## Context

Measured on `origin/main` `8f2de0daf` after a clean `pnpm build`, with
`API_COMPARE_FORCE=1 pnpm parity:api --package activerecord`:

```text
connection_adapters/postgresql/schema_statements.rb  ->  .../schema-statements.ts   88   4   (declOnly 4)   92   96%
```

Four members Rails defines in
`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/schema_statements.rb`:

| Ruby                            | line    | TS name                      |
| ------------------------------- | ------- | ---------------------------- |
| `new_column_from_field`         | `:966`  | `newColumnFromField`         |
| `change_column_for_alter`       | `:1051` | `changeColumnForAlter`       |
| `data_source_sql`               | `:1118` | `dataSourceSql`              |
| `extract_schema_qualified_name` | `:1147` | `extractSchemaQualifiedName` |

carry their bodies on `packages/activerecord/src/connection-adapters/postgresql-adapter.ts`
(e.g. `dataSourceSql` at `:1889-1893` with two overload signatures,
`extractSchemaQualifiedName` reached from `:1866`, `:1915`, `:1937`), while
`postgresql/schema-statements.ts` declares them only as a bodyless
`Pick<PostgreSQLAdapter, ...>` on the declaration-merged `SchemaStatements`
interface (`:57-83`) — the exact `declarationOnlyInFile` shape RFC 0131 names,
and the exact residue left by #7423, which moved the enum DDL and
`columnDefinitions` the _other_ way (schema-statements -> adapter, correctly,
because Rails has those in `postgresql_adapter.rb`).

These four are the mirror image: Rails has them in
`postgresql/schema_statements.rb`, so the bodies belong in
`postgresql/schema-statements.ts`. Bucket B — misplacement, no tooling change.

## Acceptance criteria

- The four bodies live in
  `packages/activerecord/src/connection-adapters/postgresql/schema-statements.ts`
  under their Rails names, and the four entries leave the
  `Pick<PostgreSQLAdapter, ...>` list in that file's interface.
- `PostgreSQLAdapter` reaches them through the `SchemaStatements` mixin, as it
  already does for the other 88 members of that file. `dataSourceSql`'s two
  overload signatures move with it; Rails' one signature is
  `data_source_sql(name = nil, type: nil)`.
- `connection_adapters/postgresql/schema_statements.rb` reads **92/92** with
  `DeclOnly 0`, and `postgresql_adapter.rb` does not regress.
- No `declare`, no bodyless signature, as the fix. No baseline row, no
  allowlist widening, no `@noRailsEquivalent` receipt.
- `pnpm parity:api:calls`, `:calls:args`, `:params` and `:extra:gate` stay
  green; PG lane green.

## Notes

Independent of `retire-postgresql-columns-override-for-column-definitions`
(still blocked on the `columns()` override deadlock at
`postgresql/schema-statements.ts:485`) — this story moves bodies between files
and does not touch the override or `columnDefinitions`.
