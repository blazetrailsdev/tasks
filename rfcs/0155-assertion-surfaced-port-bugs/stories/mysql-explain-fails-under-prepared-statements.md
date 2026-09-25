---
title: "mysql-explain tests fail under MYSQL_PREPARED_STATEMENTS"
status: done
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#7944
claim: "2026-09-25T01:04:13Z"
assignee: "migration-test-inline-adapter-branches"
blocked-by: null
closed-reason: null
---

## Context

With `ARCONN=mysql2 MYSQL_PREPARED_STATEMENTS=1` on mariadb:11, five tests in `packages/activerecord/src/adapters/abstract-mysql-adapter/mysql-explain.test.ts` fail on origin/main (reproduced while working on trails#7940): `explain for one query`, `explain with eager loading`, `explain options with eager loading`, `explain with options as strings`, `explain with options as symbol`. Each is an AssertionError on the EXPLAIN SQL text match: under prepared statements the explained SQL carries `?` binds where the test expects the literal id.

Rails: `vendor/rails/activerecord/test/cases/adapters/abstract_mysql_adapter/mysql_explain_test.rb` passes in both modes. `ActiveRecord::Explain#exec_explain` (`vendor/rails/activerecord/lib/active_record/explain.rb`) renders the collected binds after the SQL, and the MySQL arm (`abstract_mysql_adapter.rb` `explain`) runs `EXPLAIN` with those binds.

CI does not run the prepared-statements lane, so nothing gates this.

## Acceptance criteria

- All five tests pass under `MYSQL_PREPARED_STATEMENTS=1` and in the default lane.
- The explained SQL and bind rendering match Rails' `exec_explain` output in both modes.
