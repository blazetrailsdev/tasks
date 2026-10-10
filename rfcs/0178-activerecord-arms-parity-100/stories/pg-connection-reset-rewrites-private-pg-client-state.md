---
title: "activerecord: PG::Connection#reset rewrites private pg.Client state in place"
status: ready
updated: 2026-10-09
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
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

Left by trails#8729. Rails' `reconnect`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:944-952`) calls
`@raw_connection&.reset`, the pg gem's `PG::Connection#reset`. The port's `reset`
(`packages/activerecord/src/pg/connection.ts`) re-establishes a `pg.Client` in place: it ends the client,
assigns a new protocol connection and rewrites ten private fields of the `pg` 8.x client (`_ending`, `_ended`,
`_connecting`, `_connected`, `_connectionError`, `_queryable`, `_activeQuery`, `_queryQueue`, `processID`,
`secretKey`) back to the constructor's initial values, then calls `connect()` again. A `pg` release that adds
or renames a state field breaks it silently. Two more limits:

- A `stream` configured as a single instance, not a factory, is closed by the reset and cannot be reused, so
  `reset` raises `PG::ConnectionBad` and `reconnect` falls through to `connect`.
- Every failure inside `reset`, a `TypeError` on a test double included, is raised as `PG::ConnectionBad`.

The story that introduced it proposed making the raw connection a holder class that owns its `pg.Client` and
swaps it on `reset`; that was not done because every adapter call site and test treats the raw connection as a
`pg.Client`.

## Acceptance criteria

- [ ] `reset` no longer writes private `pg.Client` state: the raw connection is a holder that replaces its
      client, or the reset goes through a supported `pg` API.
- [ ] `reconnect` keeps Rails' body, and `adapters/postgresql/postgresql-adapter.trails.test.ts`'s three
      reconnect tests stay green on the PostgreSQL lane.
