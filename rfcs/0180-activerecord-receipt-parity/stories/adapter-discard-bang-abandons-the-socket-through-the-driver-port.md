---
title: "activerecord: discard! abandons the socket through each driver's own method"
status: draft
updated: 2026-10-02
rfc: "0180-activerecord-receipt-parity"
cluster: findings
packages: ["activerecord"]
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

Surfaced by the `activerecord-audit-permanent-receipts-ca-root` audit: the receipt below was `PERMANENT`, no CLAUDE.md section ratifies it, and it is re-tagged `CONVERGEABLE` onto this story.

`packages/activerecord/src/connection-adapters/abandon-raw-socket.ts` exports `abandonRawSocket(rawConnection)`, `@noRailsEquivalent`. It duck-types a raw driver handle for `.stream` or `.connection.stream`, strips the socket's listeners and `unref`s it. Four sites call it: `PostgreSQLAdapter#discardBang` and `_teardownRacedClient` (`postgresql-adapter.ts`), `Mysql2Adapter#discardBang` and the raced-connect arm of its connect path (`mysql2-adapter.ts`).

Rails has no shared helper. Each adapter's `discard!` makes one call on its own driver object:

- `vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:394-398` — `@raw_connection&.socket_io&.reopen(IO::NULL) rescue nil`
- `vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/mysql2_adapter.rb:131-137` — `@raw_connection&.automatic_close = false`, inside `@lock.synchronize`

So the helper is one invented function standing where two different driver methods are called, in a file with no Rails counterpart. The settled shape for a gem-backed port is a wrapper around the npm client that answers the gem's own method names.

## Acceptance criteria

- [ ] The pg wrapper answers the `socket_io.reopen(IO::NULL)` call and the mysql2 wrapper answers `automatic_close=`, each doing what `abandonRawSocket` does for that driver.
- [ ] `PostgreSQLAdapter#discardBang` and `Mysql2Adapter#discardBang` are Rails' bodies line for line (`super`, the one driver call, `@raw_connection = nil`; mysql2 inside the lock).
- [ ] `abandon-raw-socket.ts` and its receipt are deleted; `pnpm parity:api:extra:gate` (activerecord rowless) and `pnpm parity:api:receipts:gate` green.

## Verification

```bash
pnpm parity:api:extra:gate && pnpm parity:api:receipts:gate && pnpm parity:api:calls
```
