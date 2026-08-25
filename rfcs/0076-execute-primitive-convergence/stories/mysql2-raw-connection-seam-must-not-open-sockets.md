---
title: "mysql2: the withRawConnection acquisition seam opens sockets Rails never opens in the loop"
status: done
updated: 2026-08-10
rfc: "0076-execute-primitive-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6313
claim: "2026-08-10T00:10:55Z"
assignee: "port-test-date-arith-operators"
blocked-by: null
closed-reason: null
---

## Context

`Mysql2Adapter#_ensureClient()` still configures inside the raw-connect promise
chain (`packages/activerecord/src/connection-adapters/mysql2-adapter.ts`, the
`if (configure) await this.attemptConfigureConnection()` at the tail of the
connect chain). Rails has no configure-inside-raw-connect: every dispatch flows
through `connect!` / `reconnect!` / `verify!`
(`activerecord/lib/active_record/connection_adapters/mysql2_adapter.rb:144,:150`,
`abstract_adapter.rb:1216`).

PR for `mysql2-retire-inline-ensureclient-configure` did the inventory and
retired the bespoke teardown (the inline `try/catch { disconnectBang }` became
the shared `attemptConfigureConnection`), but could not delete the dispatch
site. The one caller that can reach an UNCONFIGURED socket is
`rawConnectionForBlock()` -> `getConn()` -> `_ensureClient()`:
`withRawConnection` runs its pre-loop `connectBang()` only when
`this._connection === null && this.isReconnectCanRestoreState()`
(`abstract-adapter.ts:2383`), so a dirty raw connection or a non-restorable
transaction stack skips the lifecycle entirely and the acquisition seam opens
the first socket itself.

Rails' `with_raw_connection` never opens a socket in the loop — it yields the
`@raw_connection` `connect!`/`verify!` already established
(`abstract_adapter.rb:1030-1070`). Converging means the mysql2 acquisition seam
stops opening sockets, at which point the `configure` parameter and the last
inline dispatch both delete.

## Acceptance criteria

- [ ] `rawConnectionForBlock()` no longer opens a connection: the socket is
      established by the `connectBang`/`verifyBang`/`reconnectBang` lifecycle
      before the loop yields, as Rails' `@raw_connection` is.
- [ ] The `configure` parameter of `_ensureClient` and its last call site are
      deleted; `attemptConfigureConnection` is the single dispatch, as in Rails.
- [ ] `mysql2-adapter.configure-on-connect.trails.test.ts` and adapter_test.rb
      recovery/retry tests stay green on the MySQL/MariaDB lanes.
