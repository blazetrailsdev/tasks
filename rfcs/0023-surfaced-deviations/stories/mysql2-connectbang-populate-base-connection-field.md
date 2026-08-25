---
title: "Mysql2Adapter connectBang/reconnect should populate base _connection so run-loop guard fires once per connect (Rails parity)"
status: done
updated: 2026-07-06
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: 4686
claim: "2026-07-06T16:41:01Z"
assignee: "mysql2-connectbang-populate-base-connection-field"
blocked-by: null
closed-reason: null
---

## Context

Surfaced during PR #4661 (mysql2-eager-connectbang-runs-configure-connection).

Rails' `Mysql2Adapter#connect` sets `@raw_connection = new_client(...)`
(mysql2_adapter.rb:144), so after `connect!` the base run loop's
`with_raw_connection` guard (`@raw_connection.nil?`) is satisfied and does NOT
re-open on every query.

trails' `Mysql2Adapter` populates only its private `_client` in
`_ensureClient()` — it never assigns the base `_connection` field to the live
connection. The only non-null `_connection` assignment is the deprecated
`_unconfiguredConnection` promotion in `verifyBang`
(abstract-adapter.ts:1167), which a genuinely fresh adapter never hits.

Consequence: the run-loop pre-check
`if (this._connection === null && this.isReconnectCanRestoreState()) await this.connectBang()`
(abstract-adapter.ts:2097) fires `connectBang()` on EVERY `withRawConnection`
call, not once per connect. It's not a correctness bug today —
`_ensureClient()` short-circuits cheaply on the cached `_client`
(mysql2-adapter.ts:614) — but it diverges from Rails' once-per-connect posture
and does redundant work every query. PostgreSQLAdapter, by contrast, populates
`_connection` in `connectBang`/`reconnect` so the guard fires once
(abstract-adapter.ts:2164-2165 comment).

## Acceptance criteria

- [ ] A fresh `Mysql2Adapter` populates the base `_connection` field with the
      live connection on `connectBang()`/`reconnect()`, so the run-loop guard
      `_connection === null` fires `connectBang()` once per connect rather than
      per query — matching Rails and the PostgreSQLAdapter posture.
- [ ] `_connection` is nulled on the existing teardown paths
      (`disconnectBang`/`reconnect`/`discardBang`/`close`) so a re-open still
      re-fires connectBang.
- [ ] `active`/`isConnected` invariants preserved (they currently key off
      `_client`; keep `active ⟹ isConnected`).
- [ ] MySQL/MariaDB CI green (adapter-gated). No bespoke tables.
