---
title: "Return IndexDefinition instances from adapter indexes() instead of plain rows"
status: done
updated: 2026-08-02
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 5877
claim: "2026-08-02T12:16:48Z"
assignee: "adapter-indexes-return-real-indexdefinition-instances"
blocked-by: null
closed-reason: null
---

## Context

PR #5858 typed the adapter surface as `IndexDefinitionRow` (a structural
interface in
`packages/activerecord/src/connection-adapters/abstract/schema-definitions.ts`),
but every adapter still returns plain object literals rather than instances of
the ported `IndexDefinition` class in the same file. Rails' `indexes` returns
real `IndexDefinition` structs
(`activerecord/lib/active_record/connection_adapters/abstract/schema_definitions.rb:8`;
SQLite `sqlite3/schema_statements.rb:8`, PostgreSQL
`postgresql/schema_statements.rb:86`, MySQL `mysql/schema_statements.rb:8` all
build `IndexDefinition.new`), so consumers get its derived behavior
(`concise_options` normalization of orders/lengths/opclasses, `column_names`,
`defined_for?`).

Structural rows skip that normalization, which is why `orders` is typed
`Record<string, string> | string` at the boundary.

## Acceptance criteria

- Adapter `indexes()` implementations construct `IndexDefinition` instances
  (as Rails does) instead of object literals, and `IndexDefinitionRow` is
  retired or reduced to the class type.
- Consumers (schema dumper, `indexExists`, `indexNameForRemove`, Migration)
  keep working; `pnpm typecheck` and the schema-dumper / index suites pass.
