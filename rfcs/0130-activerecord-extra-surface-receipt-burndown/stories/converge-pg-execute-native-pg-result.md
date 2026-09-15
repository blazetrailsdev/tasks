---
title: "converge-pg-execute-native-pg-result"
status: done
updated: 2026-09-15
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#7793
claim: "2026-09-15T14:27:36Z"
assignee: "converge-pg-execute-native-pg-result"
blocked-by: null
closed-reason: null
---

## Context

Rails' PostgreSQL `execute` override is `super` plus the notice-warning `ensure`
(`activerecord/lib/active_record/connection_adapters/postgresql/database_statements.rb:39`),
so it returns the native `PG::Result`, which is `Enumerable` over row hashes and carries
`getvalue`, `ntuples`, `cmd_tuples`, `fields`, `values`.

trails' `pg.QueryResult` is not iterable as hashes, so `connection-adapters/postgresql/database-statements.ts`
`execute` converts the native result into a `Result#toArray()` row-hash array with the native
fields copied on (trails#7743 moved this out of the deleted `PostgreSQLAdapter#internalExecute`
override). Roughly 280 `execute` call sites (tests, `support/drop-all-tables.ts`) iterate it.

## Acceptance criteria

- `performQuery` returns a `PG::Result`-shaped wrapper (iterable over row hashes, with
  `getvalue`/`ntuples`/`cmdTuples`/`fields`/`values`) so PG `execute` is `super` + `ensure` only.
- The row-hash shaping in PG `execute` is deleted; `castResult` / `affectedRows` read the wrapper.
- PostgreSQL lane green.
