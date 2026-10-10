---
title: "activerecord: PG dealloc and cancel_any_running_query rescue only the driver error, as rescue PG::Error does"
status: done
updated: 2026-10-10
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps:
  - pg-driver-errors-carry-a-result-at-the-raw-connection-boundary
deps-rfc: []
est-loc: 120
priority: null
pr: trails#8744
claim: "2026-10-10T03:09:39Z"
assignee: "mysql2-client-scores-against-the-vendored-mysql2-gem"
blocked-by: null
closed-reason: null
---

## Context

Left over from `activerecord-converge-missing-control-flow-arms-connection-adapters-part-2` (trails PR 8549),
which restored the `rescue` arm at two PostgreSQL sites as a bare `catch {}`:

- `packages/activerecord/src/connection-adapters/postgresql-adapter.ts`, `StatementPool#dealloc`.
  Rails: `vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:307-316`,
  ending `rescue PG::Error`.
- `packages/activerecord/src/connection-adapters/postgresql/database-statements.ts`,
  `cancelAnyRunningQuery`. Rails:
  `vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql/database_statements.rb:127-133`,
  ending `rescue PG::Error`.

Rails rescues the driver's error class only. The port swallows everything, programmer errors included
(a `TypeError` from a raw connection missing `status()` / `cancel()` / `block()` would vanish).

It could not be narrowed in that PR because node-pg has no single error class: server errors are
`pg.DatabaseError`, connection-level failures are bare `Error`s, and the cancel path's errors come off a
separate `pg.Connection` socket (`_cancel` in `postgresql-adapter.ts`) as bare socket errors that
`_isConnectionError` / `_isConnectionClosedBeforeSend` do not match. Using that enumeration would let a
failed cancel raise out of `ROLLBACK`.

`pg-driver-errors-carry-a-result-at-the-raw-connection-boundary` gives driver errors one carrier. That
story's context names only `translateException`; these two sites, and the cancel socket's errors, need the
same carrier.

## Acceptance criteria

- [ ] Errors raised by the raw connection's `query`, `cancel` and `block` members are the driver error
      carrier, including errors from the cancel socket.
- [ ] `dealloc` and `cancelAnyRunningQuery` each end in a `catch` whose first statement is the
      `if (!(error instanceof <carrier>)) throw error` guard, so a non-driver error propagates.
- [ ] The arms report shows no row for either pair in either direction.
- [ ] A failed or refused cancel connection still does not raise out of `execRollbackDbTransaction`.
