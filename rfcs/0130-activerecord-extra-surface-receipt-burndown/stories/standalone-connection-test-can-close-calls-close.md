---
title: "StandaloneConnectionTest#test_can_close calls close, not disconnect!"
status: draft
updated: 2026-09-14
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#7742 retired the concrete adapters' `close` overrides so `close` is Rails' pool-returning `AbstractAdapter#close` (`activerecord/lib/active_record/connection_adapters/abstract_adapter.rb:830`). Its mechanical caller rewrite also moved `StandaloneConnectionTest#test_can_close` (`packages/activerecord/src/connection-adapters/standalone-connection.test.ts:31-34`) from `connection.close()` to `connection.disconnectBang()`. Rails' test (`activerecord/test/cases/connection_adapters/standalone_connection_test.rb:32-35`) calls `@connection.close` and asserts `!active?`. A standalone connection's pool is `NullPool` (`abstract/connection_pool.rb`, `NullPool#checkin` is a no-op), so the Rails expectation depends on `close`'s NullPool arm (`abstract_adapter.rb:830-837`) — check what makes `active?` false there and port it.

## Acceptance criteria

- `standalone-connection.test.ts` "can close" calls `connection.close()` as Rails does and passes on all adapter lanes.
- `AbstractAdapter#close`'s NullPool arm matches `abstract_adapter.rb:830` line for line.
