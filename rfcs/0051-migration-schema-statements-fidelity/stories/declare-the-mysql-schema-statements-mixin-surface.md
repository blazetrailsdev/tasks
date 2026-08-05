---
title: "declare-the-mysql-schema-statements-mixin-surface"
status: done
updated: 2026-08-05
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: 10
pr: 6117
claim: "2026-08-05T03:14:59Z"
assignee: "converge-context-set-defaults-remaining-three"
blocked-by: null
closed-reason: null
---

## Context

`abstract-mysql-adapter.ts:2156` runs
`include(AbstractMysqlAdapter, MysqlSchemaStatements)`, but unlike
`AbstractAdapter` (`abstract-adapter.ts:209`) and `PostgreSQLAdapter`
(`postgresql-adapter.ts:4697`), MySQL has **no** declaration-merged
`export interface AbstractMysqlAdapter`. TypeScript therefore cannot see any of
the mixed-in methods on the class type, and every caller silently falls back to
`AbstractAdapter`'s base signature — the same failure mode
`mixin-declaration-interface-can-drift-from-its-module` (PR #5863) fixed for the
other two adapters, one step earlier.

Rails mixes the module the same way for all three
(`abstract_mysql_adapter.rb` `include MySQL::SchemaStatements`;
`postgresql_adapter.rb:185` `include PostgreSQL::SchemaStatements`).

The drift lint from #5863 (`scripts/mixin-declaration-drift.ts`, `PAIRS` in
`scripts/mixin-declaration-drift.test.ts`) is pair-driven — adding MySQL is one
entry once the interface exists.

## Acceptance criteria

- `AbstractMysqlAdapter` declares its `MySQL::SchemaStatements` surface in a
  declaration-merged interface, matching the mixin's signatures.
- A third `PAIRS` entry covers `AbstractMysqlAdapter`/`MysqlSchemaStatements`,
  and both drift checks pass for it.
- Any signature the interface cannot match carries a `drift-ok:` comment with
  its reason.
