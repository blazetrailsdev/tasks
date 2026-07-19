---
title: "converge mysql2 internalExecQuery onto the shared performQuery primitive"
status: draft
updated: 2026-07-19
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

After #4948 unified `execute`/`executeMutation` onto the shared
`mysql2/database-statements.ts` `performQuery` port (and `internalExecute`
already uses it, `mysql2-adapter.ts:1230`), `internalExecQuery`
(`mysql2-adapter.ts:626`) is the last query surface that still hand-rolls its
own array-mode driver call + `unwrapMultiResult` + `_handleWarningsOn` inline
(lines ~665-697) instead of delegating to the one `performQuery` primitive.
Rails routes `internal_exec_query` through `perform_query` like every other
statement (`mysql2/database_statements.rb`). Converging it removes the
duplicated unwrap/warnings/affected-rows logic and leaves a single SQL
primitive for the adapter.

## Acceptance criteria

- [ ] `internalExecQuery` runs its statement through the shared `performQuery`
      port (or the adapter's `_performQuery`) rather than an inline
      `mysqlConn.query`/`execute` + `unwrapMultiResult`.
- [ ] `castResult` builds the `Result` from the port's `{ rows, fields }`,
      preserving array-mode duplicate-column handling and column_types.
- [ ] `allowRetry` threading and the readonly guard are preserved.
- [ ] MySQL adapter tests green (`ARCONN=mysql2`), including MariaDB.
