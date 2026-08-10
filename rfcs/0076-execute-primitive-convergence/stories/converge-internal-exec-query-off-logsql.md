---
title: "converge-internal-exec-query-off-logsql"
status: done
updated: 2026-08-10
rfc: "0076-execute-primitive-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6327
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `internal_exec_query` is exactly `cast_result(internal_execute(...))`
(`activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb:545-547`).
`internal_execute` reaches `raw_execute` (`:589-591` → `:552-558`), which is the
single site that both logs (`log(sql, name, binds, type_casted_binds, ...)`,
`:553`) and materializes (through `with_raw_connection`, `:555`).

trails' abstract `internalExecQuery`
(`packages/activerecord/src/connection-adapters/abstract/database-statements.ts`)
wraps its delegation in `logSql` and materializes itself before calling
`internalExecute`. Every concrete adapter's `internalExecute` logs, so on paper
that is a second `sql.active_record` event for one query — in practice all three
adapters override `internalExecQuery`, so the abstract body is unreachable for
them and nothing double-logs today.

The wrapper is not purely a log: `logSql`'s rescue is what attaches `sql` /
`binds` to an already-translated `StatementInvalid` (Rails' `log` rescue →
`e.set_query(sql, binds)`), and
`abstract/database-statements.test.ts > internalExecQuery > attaches sql and
binds to a translated StatementInvalid via set_query` pins that against a bare
host whose `internalExecute` does not log. Removing the wrapper without
relocating `set_query` reds that test.

The sibling `rawExecQuery` was converged to bare `castResult(rawExecute(...))`
in PR #6327, where `rawExecute` gained Rails' `log`.

## Acceptance criteria

- [ ] Abstract `internalExecQuery` is `castResult(internalExecute(...))` with no
      `logSql` wrapper and no materialize of its own.
- [ ] The `set_query` attachment lives where Rails puts it — the `log` rescue on
      the `raw_execute` path — so the behavior the test above pins survives
      without the test being reworded.
- [ ] All three lanes green; parity:api / parity:test deltas non-negative.
