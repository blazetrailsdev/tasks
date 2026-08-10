---
title: "Retire the introspect* passthrough helpers"
status: done
updated: 2026-08-02
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 5852
claim: "2026-08-02T01:46:48Z"
assignee: "retire-introspect-helper-indirection"
blocked-by: null
closed-reason: null
---

## Context

After PR #5847 the four helpers in
`packages/activerecord/src/schema-introspection.ts` (`introspectTables` /
`introspectColumns` / `introspectIndexes` / `introspectPrimaryKey`) are pure
one-line passthroughs to `adapter.tables()` / `columns()` / `indexes()` /
`primaryKey()` — adapter methods supplied by `include SchemaStatements`
(`abstract_adapter.rb:35`, `abstract/schema_statements.rb:81`). The module has
no Rails counterpart: Rails' `SchemaDumper` calls `@connection.tables`,
`@connection.columns(table)`, `@connection.indexes(table)` directly
(`schema_dumper.rb`).

The only remaining non-trivial bit is `introspectPrimaryKey`'s
null-to-empty-array normalization, which belongs at its call sites.

## Acceptance criteria

- The `introspect*` helpers are removed and their callers
  (`schema-dumper.ts`, `model-schema.ts`, `model-codegen.ts`) call the adapter
  methods directly, matching Rails' `SchemaDumper` shape.
- `IntrospectedIndex` either moves to where it is still needed or is replaced
  by the adapter's own index descriptor type.
- `schema-introspection.trails.test.ts` is retired with the module.
- `parity:api` / `parity:test` delta non-negative.
