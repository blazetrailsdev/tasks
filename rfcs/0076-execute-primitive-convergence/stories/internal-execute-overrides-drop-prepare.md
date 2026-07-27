---
title: "Adapter internalExecute overrides accept prepare and silently drop it"
status: draft
updated: 2026-07-27
rfc: "0076-execute-primitive-convergence"
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

PR #5384 threaded `prepare` through the abstract execution path: the free
`internalExecute`
(`packages/activerecord/src/connection-adapters/abstract/database-statements.ts:1952`)
now takes it in its options object and forwards it to `rawExecute` -> `performQuery`,
and `internalExecQuery` forwards it down. `DatabaseStatementsHost` and
`AbstractAdapter` both declare it.

The three real adapter overrides still ignore it:

- `postgresql-adapter.ts` `internalExecute` destructures only
  `{ materializeTransactions, allowRetry, binds }`
- `mysql2-adapter.ts` the same
- `sqlite3-adapter.ts` destructures only `{ materializeTransactions }`

So on every live path the option is accepted and silently dropped. Rails'
`internal_execute(sql, name, binds, prepare:, async:, allow_retry:,
materialize_transactions:)` forwards `prepare:` to `raw_execute`, which passes it
into `perform_query`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb:589-591`
and `:552-558`).

Latent rather than live today: all three adapters also override
`internalExecQuery`, and those overrides reach prepared statements by their own
route (PG threads `prepareHint` into `_runQuery`). The gap bites whoever next
routes a prepared read through `internalExecute`, and it makes the declared
option a lie in the meantime.

Noted during review of PR #5384 and deliberately scoped out there: honouring it
means touching all three adapters' query paths, which is wider than that story.

## Acceptance criteria

- Each of the three `internalExecute` overrides accepts `prepare` and threads it
  to the same seam its `internalExecQuery` uses for prepared statements.
- A test per adapter proving a `prepare: true` call through `internalExecute`
  actually prepares (PG: a `statement_name` on the notification payload, as in
  the existing `statement key is logged` test).
- If any adapter genuinely cannot honour it, the option is removed from that
  adapter's signature rather than accepted and dropped.
