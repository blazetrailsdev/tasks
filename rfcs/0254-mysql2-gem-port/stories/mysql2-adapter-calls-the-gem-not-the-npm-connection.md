---
title: "Mysql2Adapter calls the gem's closed?/close/server_info and translates Mysql2::Error subclasses, not npm error codes"
status: done
updated: 2026-11-21
rfc: "0254-mysql2-gem-port"
cluster: adapter-glue
packages: ["mysql2", "activerecord"]
deps: ["mysql2-client-is-a-class-with-async-new"]
deps-rfc: []
est-loc: 350
priority: null
pr: trails#10507
claim: "2026-11-21T16:19:51Z"
assignee: "mysql2-adapter-calls-the-gem-not-the-npm-connection"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/lib/connection-adapters/mysql2-adapter.ts` reaches past the gem into
`mysql2/promise` internals where Rails calls a gem method
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/mysql2_adapter.rb`):

- `isConnected` (`:146-157`) reads `conn.connection._closing` and `stream.destroyed`; Rails
  `connected?` is `!(@raw_connection.nil? || @raw_connection.closed?)` (`:104-106`).
- `disconnectBang` (`:181`) and `reconnect` (`:215`) call the npm `end()`; Rails calls
  `@raw_connection&.close` (`:126`, `:152`).
- `getFullVersion` (`:247-251`) reads `_handshakePacket.serverVersion`; Rails is
  `any_raw_connection.server_info[:version]` (`:168-170`). The gem port re-derives the same thing in
  `serverVersion()` (`packages/activerecord/lib/mysql2/client.ts:49-59`) for `Error#server_version`.
- `translateException` (`:256-269`) classifies npm `code` strings in `isMysql2DriverTimeout` /
  `isMysql2ConnectionError` (`:337-367`, both `@internal`, no Rails name). Rails:
  `if exception.is_a?(::Mysql2::Error::TimeoutError) && !exception.error_number` →
  `AdapterTimeout`; `elsif exception.is_a?(::Mysql2::Error::ConnectionError)` →
  `ConnectionNotEstablished` / `ConnectionFailed` (`:172-182`).

The last row works today only because `driverError` (`client.ts:62-81`) lets an npm error with no
`errno` through unwrapped and adds it to `DRIVER_ERRORS` (`error.ts:3`), and
`Error[Symbol.hasInstance]` (`error.ts:55-61`) makes it answer `instanceof Mysql2.Error`. The gem
instead raises `Mysql2::Error::TimeoutError` for a read timeout
(`vendor/mysql2/0.5.6/ext/mysql2/client.c:754`) and `rb_raise_mysql2_error` (`client.c:263`) for
the rest, so the classification belongs in the gem's engine boundary, and the adapter only asks
`instanceof`.

## Acceptance criteria

- [ ] `Client#isClosed`, `#close` and `#serverInfo` (returning `{ id, version }` as `rb_mysql_client_server_info` does) are the gem's C-half members; `isConnected`, `disconnectBang`, `reconnect` and `getFullVersion` call them with Rails' bodies. No adapter line reads `_closing`, `stream`, `_handshakePacket` or calls `end()`.
- [ ] `serverVersion()` in the package reads the client's own `serverInfo`, not a handshake packet.
- [ ] The package's error boundary raises `Mysql2::Error::TimeoutError` (with `errorNumber` null) for the npm timeout codes and `Mysql2::Error::ConnectionError` for the connection-lost / refused codes the adapter lists today, and a `Mysql2::Error` with `errno` otherwise; no npm error escapes the client unwrapped.
- [ ] `translateException` is `mysql2_adapter.rb:172-182` line for line over `instanceof Mysql2.Error.TimeoutError` / `ConnectionError`; `isMysql2DriverTimeout` and `isMysql2ConnectionError` are deleted.
- [ ] `driverError` (`client.ts:61-81` before the move) becomes a private member of `Client` at the engine boundary, the analogue of `rb_raise_mysql2_error` (`ext/mysql2/client.c:263`), and its `@noRailsEquivalent PERMANENT` receipt is deleted.
- [ ] `DRIVER_ERRORS` and `Error[Symbol.hasInstance]` and their two `@noRailsEquivalent PERMANENT` receipts are deleted. With story 3's five, no `@noRailsEquivalent` remains in `packages/mysql2/lib`.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` show no new row for `mysql2_adapter.rb`; any row this converges is deleted from its baseline.

## Verification

```bash
pnpm vitest run packages/mysql2 packages/activerecord/test/cases/adapters/mysql2 packages/activerecord/test/cases/connection-adapters && pnpm parity:api:calls && pnpm parity:api:calls:args
```
