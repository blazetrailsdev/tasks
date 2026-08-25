---
title: "MySQL::SchemaCreation re-implements visit_TableDefinition Rails never overrides"
status: done
updated: 2026-08-05
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps:
  - abstract-schema-creation-missing-inline-index-branch
deps-rfc: []
est-loc: 180
priority: null
pr: 6106
claim: "2026-08-05T00:11:03Z"
assignee: "pin-fixture-pools-via-connection-notification"
blocked-by: null
closed-reason: null
---

## Context

Rails' `MySQL::SchemaCreation`
(vendor/rails/activerecord/lib/active_record/connection_adapters/mysql/schema_creation.rb)
does **not** override `visit_TableDefinition`. It defines only
`visit_AddColumnDefinition`, `visit_ChangeColumnDefinition`,
`visit_DropForeignKey`, `visit_DropCheckConstraint`, `add_column_options!`,
`add_column_position!`, `index_in_create` (:98-101) and `add_sql_comment!` —
CREATE TABLE assembly stays in the abstract visitor (abstract/schema_creation.rb:45-73).

trails re-implements the whole visitor body in
`packages/activerecord/src/connection-adapters/mysql/schema-creation.ts`
(`visitTableDefinition`), duplicating the columns/primary-keys/indexes/FK/check
sequence. That duplicate is why the inline-index branch drifted: it iterated
`o.indexes` directly (hand-copying a subset of the option keys) while the
abstract visitor grew no index branch at all. PR #6095 converged the option
handling, but the override itself is still there, and it also silently drops
the abstract visitor's `tableConstraintStatements(o)` push.

## Acceptance criteria

- [ ] `MySQL::SchemaCreation` has no `visitTableDefinition`; MySQL CREATE TABLE
      is assembled by the abstract visitor, with MySQL behavior reached through
      the overridden hooks Rails uses (`visitColumnDefinition`/
      `addColumnOptions`, `indexInCreate`, `addTableOptionsBang`, the
      `supports*` flags).
- [ ] Depends on the abstract visitor carrying the
      `supportsIndexesInCreate()` branch
      (`abstract-schema-creation-missing-inline-index-branch`).
- [ ] `connection-adapters/mysql/schema-creation.test.ts` (including
      "inlines indexes when supportsIndexesInCreate (MySQL)") and the MySQL lane
      stay green; no test name changes.
