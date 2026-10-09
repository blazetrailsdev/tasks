---
title: "activerecord: Mysql2Adapter connect / reconnect drop the in-flight connect generation bookkeeping"
status: draft
updated: 2026-10-09
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Mysql2Adapter#connect` (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/mysql2_adapter.rb:143-147`)
is `@raw_connection = self.class.new_client(@connection_parameters)` under a
`rescue ConnectionNotEstablished => ex; raise ex.set_pool(@pool)`, and `reconnect` (`:149-155`) is
`@raw_connection&.close; @raw_connection = nil; connect` inside `@lock.synchronize`.

The port (`packages/activerecord/src/connection-adapters/mysql2-adapter.ts`) routes both through a
private `_ensureClient`, which shares one in-flight connect promise and carries state Rails has none of:
`_connectingPromise`, `_connectingPromiseGen`, `_connectGeneration`, `_discardedConnectGeneration`
and `_endingClient`. `disconnectBang`, `discardBang` and `reconnect` each bump `_connectGeneration`, and
`discardBang` records the generation it discarded so a connect that resolves afterwards leaves its
socket unclosed. `_ensureClient` also runs `SET time_zone = '+00:00'` on every new client and raises a
`RuntimeError` for a `_fakeConnection` config.

trails#8714 removed the branch from `discardBang` (`mysql2_adapter.rb:131-137`) but left the field
writes: no arms row, no call row, and no receipt shape fits a field. One known gap in what is left: two
`discard!` calls while two connects are in flight end the older socket where the set it replaced left it
unclosed.

`connect` and `reconnect` already run under the adapter lock (`reconnectBang`, `verifyBang`), which
serializes callers, so the generation counter guards only a `disconnect!` / `discard!` that lands while a
connect is awaiting.

## Acceptance criteria

- [ ] `connect` is `this._rawConnection = await Mysql2Adapter.newClient(this._connectionParameters)` under Rails' rescue, and `reconnect` is Rails' three statements under the lock.
- [ ] `_ensureClient`, `_connectingPromise`, `_connectingPromiseGen`, `_connectGeneration`, `_discardedConnectGeneration` and `_endingClient` are deleted, or each survivor is shown to be forced by an awaited connect and receipted.
- [ ] `disconnectBang` and `discardBang` hold only Rails' statements (`mysql2_adapter.rb:123-137`).
- [ ] The `SET time_zone` statement and the `_fakeConnection` raise move to where Rails has them or are removed.
- [ ] The MariaDB lane stays green for `adapters/mysql2/`, `adapters/abstract-mysql-adapter/`, `connection-adapters/` and `reconnection.test.ts`.
