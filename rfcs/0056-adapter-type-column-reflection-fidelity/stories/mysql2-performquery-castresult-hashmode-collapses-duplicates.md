---
title: "mysql2 performQuery/castResult path uses hash-keyed rows, collapsing duplicate columns (cast_result parity)"
status: claimed
updated: 2026-07-06
rfc: "0056-adapter-type-column-reflection-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: 7
pr: null
claim: "2026-07-06T19:08:56Z"
assignee: "mysql2-performquery-castresult-hashmode-collapses-duplicates"
blocked-by: null
---

## Context

trails' `internalExecute`
(`packages/activerecord/src/connection-adapters/mysql2-adapter.ts:933`,
specifically the `conn.query(driverSql)` at `:957`) requests **hash-keyed**
rows — no `rowsAsArray` option — and returns them for `castResult`/
`internalExecQuery` to build the `ActiveRecord::Result`. Hash-keyed rows
**collapse duplicate column names**: `SELECT 1 AS a, 2 AS a` yields a single
`a` (the second overwrites the first) instead of two positional columns.

Rails avoids this by configuring the connection with `query_options[:as] =
:array` (`mysql2_adapter.rb:159`) and building the Result in `cast_result` from
`result.fields` + **positional** rows
(`mysql2/database_statements.rb:111`). trails' _other_ read path,
`execQuery`/`performQuery` (`mysql2-adapter.ts:~495`), already does this
(`rowsAsArray: true`, with the comment at `:489-492` explaining the
duplicate-column rationale) — only `internalExecute` was left on hash mode.

This is the **symptom**; the structural fix is the sibling convergence story
`mysql-internalexecute-route-through-performquery` (RFC 0021), which routes
`internalExecute` through the shared array-mode `rawExecute`/`performQuery` seam
and thereby closes this gap. This story exists to track the duplicate-column
parity explicitly; **it is expected to be resolved by that convergence** — if
the convergence lands first, verify the duplicate-column case and close this as
done rather than re-fixing.

## Acceptance criteria

- [ ] The `internalExecute` → `castResult` path preserves duplicate column names
      (`SELECT 1 AS a, 2 AS a` produces two positional columns), matching Rails
      `cast_result` (`mysql2/database_statements.rb:111`) over array-mode rows.
- [ ] Prefer closing this via the `mysql-internalexecute-route-through-performquery`
      convergence (do not duplicate the fix); if that lands first, this reduces
      to a verification + close.
- [ ] Regression test for the duplicate-column case on the internalExecute path;
      CI green on MySQL 8 + MariaDB; api:compare / test:compare delta
      non-negative.
