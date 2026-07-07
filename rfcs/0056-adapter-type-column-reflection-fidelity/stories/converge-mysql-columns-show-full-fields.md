---
title: "Converge MySQL columns() onto SHOW FULL FIELDS, retiring information_schema path"
status: claimed
updated: 2026-07-07
rfc: "0056-adapter-type-column-reflection-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: 31
pr: null
claim: "2026-07-07T01:55:34Z"
assignee: "converge-mysql-columns-show-full-fields"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in review of PR #4539 (mariadb-float-limit-columns-show-full-fields).
Rails' MySQL `columns()` has no per-adapter override — `SchemaStatements#columns`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:107`)
always derives columns from `column_definitions`, which is
`SHOW FULL FIELDS FROM #{table}`
(`abstract_mysql_adapter.rb:963`) mapped through `new_column_from_field`
(`mysql/schema_statements.rb:189`). trails instead reads
`information_schema.columns` in `mysqlColumns`
(`packages/activerecord/src/connection-adapters/mysql/schema-statements.ts` `columns()`),
a pre-existing architectural divergence.

That divergence forces a growing set of MariaDB-only compensations inside the
info_schema path (all keyed on `isMariadb()`): the `"NULL"`→null default
coercion, the bare-expression function-default detection, the quoted
string-literal strip, and — added by #4539 — a conditional `SHOW FULL FIELDS`
round-trip just to recover the FLOAT-vs-DOUBLE precision that information_schema
normalizes away. The Rails-faithful `newColumnFromField` SHOW-FULL-FIELDS path
already exists and is wired into `AbstractMysqlAdapter#columns`
(`abstract-mysql-adapter.ts:218`), but `Mysql2Adapter#columns` overrides it to
call the info_schema `mysqlColumns` instead.

## Acceptance criteria

- [ ] `Mysql2Adapter#columns` sources columns via `columnDefinitions()`
      (`SHOW FULL FIELDS FROM`) + `newColumnFromField`, matching Rails, rather
      than `information_schema.columns`.
- [ ] The MariaDB-only info_schema compensations become unnecessary and are
      removed (or the info_schema `columns()` path is deleted if fully unused),
      including the #4539 conditional SHOW FULL FIELDS float re-key.
- [ ] No regression across MySQL 8 and MariaDB column-introspection suites
      (schema, sql-types, unsigned-type, virtual-column, defaults reflection,
      dumper).

## Notes

Larger than one 500-LOC PR is plausible given the default-reflection surface;
if so, split into non-overlapping PRs from main (do not stack).
