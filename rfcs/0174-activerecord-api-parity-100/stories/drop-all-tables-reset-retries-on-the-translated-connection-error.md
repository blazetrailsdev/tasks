---
title: "activerecord: drop-all-tables retries on the translated connection error, not a message match"
status: ready
updated: 2026-10-10
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by `pg-driver-errors-carry-a-result-at-the-raw-connection-boundary` (trails#8722), which
moved every message-substring classification of a node-pg error into one place,
`pgError` (`packages/activerecord/src/pg/exceptions.ts`), and exposed the verdict as
`instanceof PG.ConnectionBad` (`packages/activerecord/src/pg/pg.ts`).

One copy of the old classifier is left outside it. `_isPgConnectionError`
(`packages/activerecord/src/support/drop-all-tables.ts:121-132`) repeats the four message
substrings (`invalid frontend message`, `Connection terminated`, `client has already ended`,
`Client has encountered a connection error`) and the `code.startsWith("08")` test that
`PostgreSQLAdapter._isConnectionError` carried before that PR deleted it. `resetPgTables`
(`drop-all-tables.ts:134`) uses it to decide whether to reconnect and retry a reset.

The error `resetPgTables` catches has already crossed the adapter, so Rails' answer is the
translated class: `translate_exception`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:805-820`)
turns a `PG::ConnectionBad` into `ConnectionFailed` or `ConnectionNotEstablished`. The helper
re-derives that from the message instead.

Its tests (`packages/activerecord/src/support/drop-all-tables.trails.test.ts:54,88`) feed it bare
`Object.assign(new Error("Connection terminated unexpectedly"), {...})` doubles, which is why the
PR left it alone: the doubles are neither stamped nor translated.

## Converged shape

`resetPgTables` retries on `error instanceof ConnectionFailed || error instanceof
ConnectionNotEstablished` (or, where the raw error is what reaches it, `instanceof
PG.ConnectionBad` on the error or its `cause`). `_isPgConnectionError` is deleted. The two tests
raise what the adapter raises: a translated ActiveRecord error whose `cause` is a stamped driver
error.

## Acceptance criteria

- [ ] `_isPgConnectionError` is gone from `support/drop-all-tables.ts`, and no message substring of
      a node-pg error is tested anywhere outside `pg/exceptions.ts`
      (`grep -rn "Connection terminated\|client has already ended\|invalid frontend message" packages/activerecord/src`
      hits only `pg/exceptions.ts` and tests).
- [ ] `resetPgTables` still reconnects and retries once after a severed connection, covered by the
      existing two tests rewritten to raise translated errors.
- [ ] `pnpm vitest run packages/activerecord/src/support/drop-all-tables.trails.test.ts` passes.
