---
title: "PG addForeignKey builds SQL inline instead of going through abstract add_foreign_key/schema_creation"
status: done
updated: 2026-06-21
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 3800
claim: "2026-06-21T15:02:43Z"
assignee: "pg-add-foreign-key-converge-to-abstract"
blocked-by: null
---

## Context

`PostgreSQLSchemaStatements.addForeignKey`
(packages/activerecord/src/connection-adapters/postgresql/schema-statements-class.ts:1109)
hand-builds the `ALTER TABLE ... ADD CONSTRAINT ... FOREIGN KEY ...` SQL inline
and re-implements column/name/pk defaulting. Rails PostgreSQL does NOT override
`add_foreign_key`; the abstract `add_foreign_key`
(activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb)
runs `foreign_key_options` then `schema_creation.accept(AlterTable + ForeignKeyDefinition)`.
The inline TS port duplicates logic that already exists (foreignKeyOptions,
visitAddForeignKey/visitForeignKeyDefinition) and can drift (the SHA256-name
deviation fixed in PR #3795 existed only because of this duplication).

Surfaced while fixing pg-add-foreign-key-name-uses-sha256-identifier (PR #3795).

## Acceptance criteria

- [ ] PG `addForeignKey` converges to the abstract path (foreignKeyOptions +
      schema_creation AlterTable/ForeignKeyDefinition), mirroring Rails — no
      bespoke inline SQL/defaulting where the abstract path suffices.
- [ ] Schema-qualified from/to tables and deferrable/onDelete/onUpdate/validate/
      ifNotExists options preserved.
- [ ] No test-name changes; existing PG FK tests stay green.
