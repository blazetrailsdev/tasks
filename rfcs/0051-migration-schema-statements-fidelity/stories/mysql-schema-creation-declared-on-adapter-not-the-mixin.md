---
title: "Delete AbstractMysqlAdapter's duplicate schemaCreation getter; Rails puts it in MySQL::SchemaStatements"
status: done
updated: 2026-08-05
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6129
claim: "2026-08-05T15:01:05Z"
assignee: "vendor-ruby-date-gem"
blocked-by: null
closed-reason: null
---

## Context

Rails defines `schema_creation` inside `MySQL::SchemaStatements`
(`activerecord/lib/active_record/connection_adapters/mysql/schema_statements.rb:139`),
the module `AbstractMysqlAdapter` includes at `abstract_mysql_adapter.rb:19` —
exactly like the abstract (`abstract/schema_statements.rb:1551`), PG
(`postgresql/schema_statements.rb:953`) and SQLite (`sqlite3/schema_statements.rb:126`)
arms.

trails declares it twice: `MysqlSchemaStatements` has the faithful
`override get schemaCreation()` (`connection-adapters/mysql/schema-statements.ts:40`),
and `AbstractMysqlAdapter` declares a second one on the class itself
(`connection-adapters/abstract-mysql-adapter.ts:292`), each with its own
`_mysqlSchemaCreation` memo. Since `include(AbstractMysqlAdapter, MysqlSchemaStatements)`
(`abstract-mysql-adapter.ts:2110`) copies the mixin's members onto the prototype,
which memo a given call reaches depends on member-copy order rather than on
anything Rails expresses.

Surfaced by PR #6117: the new declaration-merged `export interface AbstractMysqlAdapter`
declares five of the mixin's six members and has to skip `schemaCreation`
precisely because the adapter class declares it — so the drift lint
(`scripts/mixin-declaration-drift.ts`, MySQL `PAIRS` entry) cannot check that
one member.

## Converged shape

Delete the getter and the `_mysqlSchemaCreation` field from
`abstract-mysql-adapter.ts` and let the included module supply it, as Rails
does. Then add `schemaCreation` to the merged interface so all six mixin
members are drift-checked.

## Acceptance criteria

- [ ] `abstract-mysql-adapter.ts` declares no `schemaCreation` getter and no
      `_mysqlSchemaCreation` field; `MysqlSchemaStatements` is the only definition.
- [ ] `export interface AbstractMysqlAdapter` declares `schemaCreation`, and the
      MySQL `PAIRS` entry drift-checks all six members.
- [ ] MySQL/MariaDB suites green; parity:api / parity:api:extra delta non-negative.
