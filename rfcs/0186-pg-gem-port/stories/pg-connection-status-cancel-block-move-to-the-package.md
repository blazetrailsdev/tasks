---
title: "pg: transaction_status, status, cancel, block, socket_io and reset are PG::Connection methods"
status: draft
updated: 2026-10-08
rfc: "0186-pg-gem-port"
cluster: connection
packages: ["pg", "activerecord"]
deps: ["pg-connection-exec-surface-moves-to-the-package"]
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/connection-adapters/postgresql-adapter.ts:1645-1673` (`_attachReadyForQueryListener`) assigns four methods onto
the client at run time: `transactionStatus` (`:1647-1658`, from node-pg's private `_activeQuery`
and the last ReadyForQuery status byte), `status` (`:1659-1662`, from private `_ending` /
`_ended`), `cancel` (`:1663` → `_cancel` `:1675-1701`, a second `pg.Connection` sending
CancelRequest with `processID` / `secretKey`), `block` (`:1664` → `_blockUntilCommandSettles`
`:1703`). `socketIo` is in `packages/activerecord/src/connection-adapters/postgresql/pg-connection.ts:128-141`.

Rails: `vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql/database_statements.rb:127-134` (`cancel_any_running_query`:
`transaction_status`, `cancel`, `block`, `rescue PG::Error`); `vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:313`
(`conn.status == PG::CONNECTION_OK`), `:375`, `:850` (`transaction_status`), `:396`
(`socket_io&.reopen(IO::NULL)`), `:946` (`@raw_connection&.reset`, `rescue PG::ConnectionBad`).

Gem: C `vendor/pg/v1.5.9/ext/pg_connection.c`: `status` `:4518`, `transaction_status` `:4519`, `socket_io`
`:4525`, `block` `:4610`. Ruby `vendor/pg/v1.5.9/lib/pg/connection.rb`: `reset` `:575`, `cancel` `:597`.

node-pg: a `Client` cannot reconnect after `end()`, so `reset` builds a new client inside the
engine and swaps it; identity of the `PG::Connection` is preserved, which is what Rails relies on
at `:946`.

## Acceptance criteria

- [ ] `PG.Connection` has `transactionStatus()` and `status()` (sync), `cancel()` and `block()` (`Promise`), `socketIo()` (sync), `reset()` (`Promise`). The ReadyForQuery / errorMessage listeners live in the engine.
- [ ] `_attachReadyForQueryListener`, `_cancel` and `_blockUntilCommandSettles` are deleted from `postgresql-adapter.ts`, along with the `RawConnection` type's four members and every `client as pg.Client & { _activeQuery?: ... }` cast in the adapter.
- [ ] `cancelAnyRunningQuery` is line-for-line `database_statements.rb:127-134`; `reconnect`'s reset arm is `postgresql_adapter.rb:944-950`.
- [ ] `grep -n "_activeQuery\|_ending\|_ended\|processID\|secretKey" packages/activerecord/src/connection-adapters/` returns nothing: every node-pg private is behind the engine.
- [ ] `socketIo` leaves `pg-connection.ts`.
- [ ] The existing cancel tests (RFC 0085's) pass unchanged on the PG lane.

## Verification

```bash
pnpm vitest run packages/pg packages/activerecord/src/connection-adapters/postgresql && pnpm parity:api:calls
```

## Notes

`status()` after backend termination is the subject of blocked story
`pg-translate-no-connection-raises-not-established`; this story moves today's behaviour without
changing it. `pg-connection-status-reports-connection-bad-after-termination` retests the blocker.
