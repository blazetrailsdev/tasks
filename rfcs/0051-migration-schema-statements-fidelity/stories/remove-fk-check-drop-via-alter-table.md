---
title: "Route removeForeignKey/removeCheckConstraint DROP through createAlterTable for adapter-specific syntax"
status: ready
updated: 2026-07-06
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced converging `removeForeignKey`/`removeCheckConstraint` name-resolution in
PR #4535. The base implementations
(`packages/activerecord/src/connection-adapters/abstract/schema-statements.ts`)
emit a hardcoded raw `ALTER TABLE <t> DROP CONSTRAINT <name>` string:

- `removeForeignKey` (~line 810): `DROP CONSTRAINT ${fk.name}`
- `removeCheckConstraint` (~line 885): `DROP CONSTRAINT ${chk.name}`

Rails routes both through `create_alter_table` + `at.drop_foreign_key(name)` /
`at.drop_check_constraint(name)` + `execute schema_creation.accept(at)`
(vendor/rails `abstract/schema_statements.rb` `remove_foreign_key` /
`remove_check_constraint`). The AlterTable/SchemaCreation path lets an adapter
emit dialect-specific DROP syntax — e.g. MySQL/MariaDB `DROP FOREIGN KEY` and
`DROP CHECK`, which differ from the generic `DROP CONSTRAINT`. Only PostgreSQL
(and MySQL 8 / MariaDB 10.2+, which happen to accept `DROP CONSTRAINT`) survive
the current deviation; it is functional today only because the tested adapters
tolerate the ANSI form. SQLite overrides both via table rebuild, so it is
unaffected.

## Acceptance criteria

- [ ] Base `removeForeignKey`/`removeCheckConstraint` build the drop via
      `createAlterTable(fromTable)` + `at.dropForeignKey(name)` /
      `at.dropCheckConstraint(name)` and `schemaCreation.accept(at)`, mirroring
      Rails, so adapter dialects (MySQL `DROP FOREIGN KEY` / `DROP CHECK`) are
      emitted rather than a hardcoded `DROP CONSTRAINT`.
- [ ] Add the `AlterTable` drop-foreign-key/drop-check-constraint node support if
      absent; no regression in PG/MySQL/MariaDB FK + check-constraint suites.
