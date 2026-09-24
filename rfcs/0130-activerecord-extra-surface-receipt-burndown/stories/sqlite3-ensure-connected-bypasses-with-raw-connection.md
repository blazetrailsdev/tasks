---
title: "SQLite3Adapter#ensureConnected is a trails-only lazy open that bypasses with_raw_connection"
status: in-progress
updated: 2026-09-24
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: 2
pr: trails#8052
claim: "2026-09-24T18:29:09Z"
assignee: "adapter-foreign-key-test-loads-fk-test-has-pk-fixture"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8036, which routed the async-driver open through `connectBang()`
but left the trails-only lazy-open guard in place.

`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts` still has:

- a private `ensureConnected()`. If `_asyncConnectPending` is set, it calls
  `connectBang()` and shares one in-flight `_connectingPromise` between callers.
  Otherwise, when the adapter isn't active, it calls `verifyBang()`.
- `sqliteConnection()`, which wraps `ensureConnected()` and returns `_rawConnection!`.
- direct `await this.ensureConnected()` calls at the top of `disableReferentialIntegrity`,
  `checkAllForeignKeysValidBang` and `alterTable`.
- the `_asyncConnectPending` / `_connectingPromise` state that exists only to support the above.

Rails has none of this. Each of those bodies runs its statements through
`execute` / `query_value`, which reach `with_raw_connection`
(`activerecord/lib/active_record/connection_adapters/abstract_adapter.rb:983-985`:
`connect! if @raw_connection.nil? && reconnect_can_restore_state?`).
`disable_referential_integrity` (`sqlite3_adapter.rb:255`) and
`check_all_foreign_keys_valid!` (`sqlite3_adapter.rb:269`) do not open a connection
themselves. `connect` / `reconnect` (`sqlite3_adapter.rb:806,812`) open the connection
synchronously, with no deferred-open state.

## Acceptance criteria

- [ ] `ensureConnected` is deleted. The lazy open happens only in
      `withRawConnection`'s `connectBang()` pre-loop, as it does in Rails.
- [ ] `sqliteConnection()` callers go through `withRawConnection`, or the method is deleted.
- [ ] The `ensureConnected` calls in `disableReferentialIntegrity`,
      `checkAllForeignKeysValidBang` and `alterTable` are removed.
- [ ] `_connectingPromise` is deleted. A concurrent first-query open is serialized
      by the adapter `lock` that `withRawConnection` already holds.
- [ ] `_asyncConnectPending` is deleted if `reconnect`'s async arm no longer needs it.
- [ ] The `sqlite-drivers` lane stays green, including async-only driver first-query open.
