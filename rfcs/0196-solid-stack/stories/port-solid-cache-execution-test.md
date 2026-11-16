---
title: "port-solid-cache-execution-test"
status: done
updated: 2026-11-15
rfc: "0196-solid-stack"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10150
claim: "2026-11-15T20:21:41Z"
assignee: "local-cache-middleware"
blocked-by: null
closed-reason: null
---

## Context

`port-solid-cache-store-execution-and-expiry` ported `SolidCache::Store::Execution` (`packages/solid-cache/lib/store/execution.ts`, from `vendor/solid_cache/v1.0.7/lib/solid_cache/store/execution.rb:1-56`) but its test file was cut for the PR LOC ceiling. A working draft port (all 6 tests passing locally) was written against that PR: ErrorSubscriber + `SolidCache.executor = class extends ExecutionWrapper {}` for "async errors are reported", `Notifications.subscribed(callback, "sql.active_record", ...)` for the three instrumentation tests, and `vi.spyOn(ConnectionPool.prototype, "leaseConnection").mockRejectedValue(new StatementTimeout())` for the two no-connections tests (`readMulti` answers `new Map()`).

## Acceptance criteria

- `vendor/solid_cache/v1.0.7/test/unit/execution_test.rb` ported as `packages/solid-cache/test/unit/execution.test.ts` with Rails' test names (`test_async_errors_are_reported`, the three `test_active_record_instrumention_*` tests and the two `test_no_connections_*` tests).
