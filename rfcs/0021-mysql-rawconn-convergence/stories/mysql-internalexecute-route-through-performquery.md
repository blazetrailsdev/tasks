---
title: "Route mysql2 internalExecute read path through rawExecute/performQuery for full Rails fidelity"
status: claimed
updated: 2026-06-15
rfc: "0021-mysql-rawconn-convergence"
cluster: null
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: "2026-06-15T15:23:11Z"
assignee: "mysql-internalexecute-route-through-performquery"
blocked-by: null
---

## Context

trails has **two** mysql2 read paths that should be one:

1. `execQuery`/`performQuery` (`packages/activerecord/src/connection-adapters/mysql2-adapter.ts:~485`)
   requests **array-mode** rows (`rowsAsArray: true`, `:495`/`:498`) so duplicate
   column names survive, mirroring Rails' `configure_connection` setting
   `query_options[:as] = :array` (`mysql2_adapter.rb:159`) feeding `cast_result`.
2. `internalExecute` (`mysql2-adapter.ts:933`) calls `conn.query(driverSql)`
   **without** `rowsAsArray` (`:957`), getting **hash-keyed** rows
   (`Record<string, unknown>[]`), then returns `{ rows, fields, affectedRows }`
   that `internalExecQuery`'s `castResult` consumes.

So the two paths diverge in row shape (positional vs hash-keyed) and the
internalExecute path duplicates the CALL/multi-result-set unwrapping logic that
already lives in `performQuery`. Rails has a single seam: `internal_execute` →
`raw_execute` → `cast_result`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/mysql2/database_statements.rb`).

Converging `internalExecute`'s read path through the shared
`rawExecute`/`performQuery` seam removes the duplicated unwrapping, makes both
paths array-mode (so duplicate columns survive everywhere — see the sibling
symptom story `mysql2-performquery-castresult-hashmode-collapses-duplicates`,
which this convergence subsumes), and matches Rails' single source of truth.

## Acceptance criteria

- [ ] `internalExecute`'s read path routes through the shared
      `rawExecute`/`performQuery` seam (array-mode rows + the single CALL/
      multi-result unwrap), rather than its own `conn.query` hash-mode call,
      mirroring Rails `internal_execute` → `raw_execute` → `cast_result`.
- [ ] Duplicate column names survive on the internalExecute path
      (`SELECT 1 AS a, 2 AS a`), closing the
      `mysql2-performquery-castresult-hashmode-collapses-duplicates` symptom.
- [ ] No regression to transaction/DDL callers of `internalExecute`
      (BEGIN/COMMIT/SAVEPOINT, `materializeTransactions` handling) or to the
      `sql.active_record` instrumentation payload.
- [ ] CI green on MySQL 8 + MariaDB; api:compare / test:compare delta
      non-negative.
