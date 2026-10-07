---
title: "activerecord: PostgreSQLAdapter runs statements on a raw connection it was handed"
status: draft
updated: 2026-10-07
rfc: "0180-activerecord-receipt-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found while testing trails#8652. `new PostgreSQLAdapter(client)` with a `pg.Client` the caller built
(the deprecated raw-connection overload, `postgresql-adapter.ts` constructor, `_acceptDeprecatedRawConnection`)
stores the client in `_unconfiguredConnection` and returns before `_pgClientOptions` is set. The first
statement then raises `ConnectionNotEstablished: connection is closed` from `_acquireFreshClient`
(reached through `verifyBang` -> `reconnectBang` -> `reconnect` -> `connect`).

Rails adopts the connection it was handed:
`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract_adapter.rb:759-768`
(`verify!`) moves `@unconfigured_connection` into `@raw_connection`, runs
`attempt_configure_connection`, stamps `@last_activity` / `@verified` and returns, without reconnecting.

`raw-connection-overload.trails.test.ts` only constructs the adapter; nothing runs a statement on one.

## Acceptance criteria

- [ ] A statement on an adapter built from a raw `pg.Client` runs on that client, taking
      `verify!`'s `@unconfigured_connection` arm as Rails does.
- [ ] A live-PG test builds the adapter from a connected `pg.Client` and runs `SELECT 1`.
- [ ] Check the MySQL and SQLite adapters for the same gap and fix or file each.
