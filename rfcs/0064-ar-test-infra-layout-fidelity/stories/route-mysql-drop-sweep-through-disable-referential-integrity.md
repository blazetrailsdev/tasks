---
title: "Route the MySQL drop sweep through disableReferentialIntegrity"
status: done
updated: 2026-07-31
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: 5691
claim: "2026-07-31T00:21:06Z"
assignee: "route-mysql-drop-sweep-through-disable-referential-integrity"
blocked-by: null
closed-reason: null
---

## Context

PR #5680 routed the sqlite arm of the drop sweep through
`adapter.disableReferentialIntegrity(...)`
(`packages/activerecord/src/support/drop-all-tables.ts`, `resetSqliteTables`),
matching Rails' `sqlite3_adapter.rb#disable_referential_integrity`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:255`).

The MySQL arm (`resetMysqlTables`, same file) still hand-rolls the identical
logic: a bare `SET FOREIGN_KEY_CHECKS=0` up front and `SET FOREIGN_KEY_CHECKS=1`
in a `finally`. Rails' own
`abstract_mysql_adapter.rb#disable_referential_integrity`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract_mysql_adapter.rb:213`)
is exactly that block, except it reads the prior value with
`SELECT @@FOREIGN_KEY_CHECKS` and restores _that_ rather than hardcoding `1`,
and guards the restore with `if active?`. The trails sweep is the only caller
that reimplements it instead of calling the ported adapter method.

Note this does NOT apply to the PG arm: `resetPgTables` relies on
`DROP TABLE … CASCADE`, and PG's `disable_referential_integrity` toggles
triggers (`ALTER TABLE … DISABLE TRIGGER`), which does not suppress FK
_dependency_ errors on `DROP TABLE`. CASCADE is the correct and only mechanism
there — leave it alone.

## Acceptance criteria

- `resetMysqlTables` wraps its DROP VIEW / DROP TABLE loop in
  `adapter.disableReferentialIntegrity(...)` instead of the hand-rolled
  `SET FOREIGN_KEY_CHECKS` pair; `truncateNonEmpty` stays outside the wrapped
  block, as it already is on the sqlite arm.
- The restore no longer hardcodes `1` — it recovers whatever the adapter method
  recovers (the prior `@@FOREIGN_KEY_CHECKS` value).
- `drop-all-tables.test.ts` still passes on the MySQL lane, and the
  `drops 3-table FK chain without error` guard still fails when the escape is
  neutralized (that test declares real FKs as of #5680).
- The PG arm is unchanged.
