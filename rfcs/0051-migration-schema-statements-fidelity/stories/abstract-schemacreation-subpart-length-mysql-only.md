---
title: "Gate index sub-part length to MySQL in abstract SchemaCreation"
status: ready
updated: 2026-07-06
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced during PR #4377 (extend-defineschema-indexspec-and-converge-companies-index-dumps).

The abstract SchemaCreation's `quotedColumnsForIndex`
(`packages/activerecord/src/connection-adapters/abstract/schema-creation.ts` ~297)
decorates index columns with a sub-part prefix length (`col(N)`)
UNCONDITIONALLY — `const len = ...; if (len) col += "(" + len + ")"` — with no
adapter gate. Sub-part index lengths are MySQL-only; on PostgreSQL/SQLite this
emits invalid DDL (`CREATE INDEX ... ("name"(10))` → sqlite `no such function:
name`). Rails' abstract `quoted_columns_for_index`
(`abstract/schema_statements.rb`) does NOT apply length — only
`AbstractMysqlAdapter`'s override does.

PR #4377 worked around this in TEST infra only: `defineSchema`
(`test-helpers/define-schema.ts`) and `generateSchemaFile`
(`test-helpers/schema-file-generator.ts`) both drop `length` for
`adapterName !== "mysql"`. The base SchemaCreation still carries the latent bug —
any non-test caller passing `length:` to `add_index` on PG/SQLite trips it.

Also noted during investigation: the `MigrationContext#add_index` path appeared
to drop sub-part length on sqlite (valid DDL) while a direct
`SchemaStatements#addIndex` kept it (invalid `col(N)`) — the two paths were
inconsistent and the divergence was never root-caused. The implementer should
reconcile both to Rails (MySQL-only length decoration).

## Acceptance criteria

- [ ] Abstract SchemaCreation `quotedColumnsForIndex` does not append sub-part
      length; only the MySQL SchemaCreation decorates columns with length
      (matching Rails).
- [ ] Remove the `adapterName === "mysql"` length gates from `defineSchema` /
      `schema-file-generator` once the base is correct (or confirm they become
      no-ops).
- [ ] Reconcile the MigrationContext-vs-SchemaStatements length inconsistency.
- [ ] api:compare / test:compare non-negative; PG/SQLite index-with-length DDL
      is valid (length silently dropped, as in Rails).
