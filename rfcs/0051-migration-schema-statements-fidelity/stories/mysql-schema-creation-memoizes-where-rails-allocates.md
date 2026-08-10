---
title: "MySQL::SchemaStatements#schema_creation allocates per call; trails memoizes it"
status: done
updated: 2026-08-05
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6141
claim: "2026-08-05T20:33:08Z"
assignee: "mysql-schema-creation-memoizes-where-rails-allocates"
blocked-by: null
closed-reason: null
---

## Context

Rails' `MySQL::SchemaStatements#schema_creation` allocates a fresh
`MySQL::SchemaCreation` on every call:

    # activerecord/lib/active_record/connection_adapters/mysql/schema_statements.rb:138-140
    def schema_creation # :nodoc:
      MySQL::SchemaCreation.new(self)
    end

trails memoizes it in a `_mysqlSchemaCreation` field
(`packages/activerecord/src/connection-adapters/mysql/schema-statements.ts:39-44`).
Observed while shipping `mysql-schema-creation-declared-on-adapter-not-the-mixin`
(PR #6129), which deleted the _second_, duplicate memo on the adapter class but
left the mixin's in place — the story scoped to the double declaration, not to
the memo.

The memo is observable: a `SchemaCreation` captures the adapter it was built
with, so a cached instance outlives changes Rails would pick up on the next
call, and any test asserting on identity or on per-call construction sees a
different object graph than Rails.

Check the sibling arms while converging — the abstract
(`abstract/schema_statements.rb:1551`), PG (`postgresql/schema_statements.rb:953`)
and SQLite (`sqlite3/schema_statements.rb:126`) definitions are all
allocate-per-call in Rails too, and the trails ports may carry the same memo.

## Converged shape

`get schemaCreation()` returns `new MysqlSchemaCreation(this)` per call, with no
backing field, as Rails does. Same for whichever sibling arms carry the memo.

## Acceptance criteria

- [ ] No `_mysqlSchemaCreation` (or sibling) memo field; each `schemaCreation`
      read allocates, matching `mysql/schema_statements.rb:138-140`.
- [ ] The abstract/PG/SQLite arms are checked and converged in the same pass if
      they carry the same memo.
- [ ] MySQL/MariaDB, PG and SQLite suites green; parity:api delta non-negative.
