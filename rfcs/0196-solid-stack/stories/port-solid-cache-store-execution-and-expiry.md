---
title: "Port SolidCache Store Execution, Expiry, Stats and Entry Expiration/Size"
status: draft
updated: 2026-11-13
rfc: "0196-solid-stack"
cluster: solid-stack
packages: ["solid-cache"]
deps: ["port-solid-cache-entry-model-and-store"]
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`SolidCache::Store::Execution` (`vendor/solid_cache/v1.0.7/lib/solid_cache/store/execution.rb:1-56`) and `Expiry` (`store/expiry.rb:1-49`) were left out of `port-solid-cache-entry-model-and-store`. `Execution` needs `Concurrent::FixedThreadPool.new(1, max_queue: 100, fallback_policy: :discard)` (ruby-compat has `ThreadPoolExecutor`, `packages/ruby-compat/lib/thread-pool-executor.ts`, no `FixedThreadPool`) plus `Record.disable_instrumentation` / `with_instrumenter` (`app/models/solid_cache/record.rb:12-28`). `Expiry#track_writes` / `expire_later` need `Entry.expire` (`app/models/solid_cache/entry/expiration.rb`), `Entry::Size` + `MovingAverageEstimate` (`entry/size.rb`, `entry/size/*.rb`) and `SolidCache::ExpiryJob`. `Stats` (`store/stats.rb`) reads `max_age` / `max_entries` from `Expiry`.

The trails Store's `Connections#with_connection_for` / `with_connection` / `with_each_connection` skip `execute` and `Entries` skips `track_writes`, receipted `@missingRailsCall … — CONVERGEABLE port-solid-cache-store-execution-and-expiry` in `packages/solid-cache/lib/store/connections.ts` and `store/entries.ts`.

## Acceptance criteria

- `Store::Execution`, `Store::Expiry`, `Store::Stats`, `Entry::Expiration`, `Entry::Size` (+ `Size::Estimate`, `MovingAverageEstimate`), `Record.disable_instrumentation` / `with_instrumenter` and `ExpiryJob` ported at their Rails names; their `initialize` bodies inlined into `Store`'s constructor with `@inlinedFrom`.
- Every `CONVERGEABLE port-solid-cache-store-execution-and-expiry` receipt is removed by calling `execute` / `track_writes`.
- `test/unit/expiry_test.rb`, `execution_test.rb`, `stats_test.rb`, and the `max age` tests in `solid_cache_test.rb` ported.
