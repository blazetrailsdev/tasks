---
title: "activerecord: Mysql2 DatabaseStatements#select_all's unprepared_statement arm has no test in the default lanes"
status: done
updated: 2026-11-16
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages:
  - "activerecord"
deps: []
deps-rfc: []
est-loc: 80
priority: 78
pr: trails#10166
claim: "2026-11-16T00:06:39Z"
assignee: "query-assertions-keyword-arg-and-materialize-transactions"
blocked-by: null
closed-reason: null
---

## Context

`Mysql2::DatabaseStatements#select_all`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/mysql2/database_statements.rb:8-14`)
is `unprepared_statement { super }` when `ExplainRegistry.collect? &&
prepared_statements`, else `super`. trails#8764 converged the port onto a
`Module` included into `Mysql2Adapter`
(`packages/activerecord/src/connection-adapters/mysql2/database-statements.ts`,
`selectAll`), reaching the abstract method through
`DatabaseStatements.superMethod(this, "selectAll")`.

The `unprepared_statement` arm is reached only with prepared statements on.
The CI lane that turns them on (`Active Record MariaDB Tests (prepared
statements)`, `.github/workflows/ci.yml` `maria-prepared-tests`) runs only on a
PR labelled `run-mysql-prepared`, and no test drives the arm directly, so the
arm shipped unexercised.

## Acceptance criteria

- A `.trails.test.ts` beside the module drives `selectAll` on a host with
  `preparedStatements` true while `ExplainRegistry` is collecting and asserts
  the abstract `selectAll` runs inside `unpreparedStatement`; a second case
  asserts it runs outside when either condition is false.
- The test needs no live MariaDB with prepared statements, so it runs in the
  default lanes.
