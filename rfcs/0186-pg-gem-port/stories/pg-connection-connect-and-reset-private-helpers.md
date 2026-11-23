---
title: "pg-connection-connect-and-reset-private-helpers"
status: ready
updated: 2026-11-23
rfc: "0186-pg-gem-port"
cluster: "connection"
packages:
  - "pg"
deps:
  - pg-connection-connect-poll-c-primitives
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# pg: port Connection's connect/reset private helpers

## Context

The operator reopened RFC 0186 on 2026-11-23 to bring `pg` to 100% on the scored
`parity:api` denominator (96/118) and the scored `parity:test` denominator (50/53).

`PG::Connection#reset` (`vendor/pg/v1.6.2/lib/pg/connection.rb:591-601`) and `PG::Connection.new`
(`:870-883`) both funnel through private Ruby helpers that `packages/pg/lib/connection.ts`
does not have. `parity:api` reports these six missing:

- `polling_loop(poll_meth)` (`:686`)
- `remove_current_host(iopts)` (`:762`)
- `async_connect_or_reset(poll_meth)` (`:793`), called from `reset` (`:600`) and `connect_to_hosts` (`:951`)
- `resolve_hosts(iopts)` (`:891`)
- `connect_to_hosts(*args)` (`:922`)
- `host_is_named_pipe?(host_string)` (`:955`), ported as `isHostIsNamedPipe`

The connection runs over node-pg through `packages/pg/lib/engine`; the poll methods
(`connect_poll` / `reset_poll`) are C, so `polling_loop` drives the engine's promise where
libpq polls a socket. Port the Ruby bodies at their Rails names and route `reset` / `new`
through them in Ruby's order.

## Acceptance criteria

- The six methods exist on `Connection` (class side for the `class << self` ones), TS-`private` plus `@internal`, with Ruby's control flow.
- `reset` calls `asyncConnectOrReset`; `new` calls `connectToHosts`.
- `pnpm parity:api --package pg` shows all six matched; `parity:api:calls` adds no rows.
