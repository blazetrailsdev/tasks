---
title: "mysql2 execute/executeMutation payloads still log driver-form binds"
status: done
updated: 2026-08-09
rfc: "0076-execute-primitive-convergence"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6292
claim: "2026-08-09T19:19:19Z"
assignee: "reset-column-information-leaves-sync-readers-cold"
blocked-by: null
closed-reason: null
---

## Context

PR #5785 fixed `Mysql2Adapter#internalExecQuery` to log the caller's own binds
on the `sql.active_record` payload (`mysql2-adapter.ts:683-684`), matching
Rails `abstract_adapter.rb:1134-1145` / `abstract/database_statements.rb:553-554`.

The adapter's three other `sql.active_record` payload builders still put the
mysql2 wire form (`driverBinds` from `mysqlBinds`) on `binds`:

- `mysql2-adapter.ts:1054-1055` (`internalExecute`)
- `mysql2-adapter.ts:1103-1104` (`executeMutation`)
- `mysql2-adapter.ts:1286-1287`

Rails' `execute` / `raw_execute` path logs `log(sql, name, async:)` with no
binds at all (`abstract/database_statements.rb`), so these payloads diverge
twice over: they carry binds Rails does not emit, and in the wire form rather
than the caller's `QueryAttribute` objects. Subscribers that read
`payload.binds` (`log-subscriber.ts:121-128`, `explain-subscriber.ts:28`) see
an inconsistent shape depending on which adapter entry point ran.

## Acceptance criteria

- Decide per call site whether Rails emits binds there at all; converge each
  payload to the Rails shape (caller binds + `typeCastedBinds(binds)`, or no
  binds), citing the Rails line.
- `driverBinds` stays scoped to the driver call.
- Green on `ARCONN=mysql2` with `MYSQL_PREPARED_STATEMENTS` both 0 and 1.
