---
title: "activerecord: port the 8 missing adapter / migrator cases"
status: ready
updated: 2026-09-30
rfc: "0175-activerecord-test-parity-100"
cluster: missing-tests
packages: ["activerecord"]
deps: ["database-statements-exec-insert-test"]
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Missing Rails cases in adapter and migrator test files:

- `adapters/postgresql/xml_test.rb` → `adapters/postgresql/xml.test.ts`: "column"; "schema dump with shorthand"
- `adapters/abstract_mysql_adapter/transaction_test.rb` → `adapters/abstract-mysql-adapter/transaction.test.ts`: "raises LockWaitTimeout when lock wait timeout exceeded"; "raises QueryCanceled when canceling statement due to user request"
- `adapters/abstract_mysql_adapter/virtual_column_test.rb` → `adapters/abstract-mysql-adapter/virtual-column.test.ts`: "change table"
- `adapters/sqlite3/json_test.rb` → `adapters/sqlite3/json.test.ts`: "default"
- `multi_db_migrator_test.rb` → `multi-db-migrator.test.ts`: "internal metadata stores environment"
- `database_statements_test.rb` → `database-statements.test.ts`: "exec insert"

`database-statements-exec-insert-test` (RFC 0023) owns `exec insert`. The two MySQL `transaction_test.rb`
cases (`LockWaitTimeout`, `QueryCanceled`) raise on lock timeouts and need two connections on the MySQL lane.

## Acceptance criteria

- [ ] Each case ported with Rails' adapter gates (`itIfSupports` / `currentAdapter`); divergences converged.
- [ ] Every file above reads 0 missing.
