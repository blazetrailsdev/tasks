---
title: "Free internalExecute takes positional binds while every host declares (sql, name, opts)"
status: ready
updated: 2026-07-20
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The free `internalExecute` in
`connection-adapters/abstract/database-statements.ts:1959` takes
`(sql, name, binds, prepare, _async, allowRetry, materializeTransactions)`
positionally. Every declared and implemented signature is
`(sql, name, opts)`:

- `AbstractAdapter#internalExecute` (abstract-adapter.ts:506)
- `DatabaseStatementsHost#internalExecute` (database-statements.ts:109)
- `SavepointsHost#internalExecute` (abstract/savepoints.ts:31)
- the sqlite3 / mysql2 / postgresql overrides

The base `internalExecQuery` calls
`this.internalExecute(sql, sqlName, { binds })` (database-statements.ts:1452),
so the opts object lands in the positional `binds` slot and the next
`typeCastedBinds` call throws `(binds ?? []).map is not a function`.

It is latent only because all three real adapters override `internalExecute`,
so the free function is unreachable on the live path. PR #4977 hit it the moment
a new caller used the base path, fixed it, then reverted the fix when that
caller was removed — shipping an unexercised signature change was not
justified, but the landmine is real and will fire for the next adapter that
does not override, or any direct caller of the exported function.

## Acceptance criteria

- [ ] The free `internalExecute` signature matches the interface every host
      declares: `(sql, name, opts)` with `binds` / `prepare` / `allowRetry` /
      `materializeTransactions` read off `opts`.
- [ ] A test that actually exercises the base path — an adapter double that
      does NOT override `internalExecute` and reaches it via
      `internalExecQuery` with binds. Without this the fix is unexercised again.
- [ ] Check whether `rawExecute`'s own positional tail
      (database-statements.ts:1855) has the same drift, and note or fix it.
