---
title: "mon-synchronize-without-als-run-for-sync-blocks"
status: draft
updated: 2026-11-14
rfc: "0241-request-path-performance"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`monSynchronize` (`packages/ruby-compat/lib/monitor.ts:152-166`) wraps every
block in `data.storage.run(owner, …)` so `currentOwner` can recognise a
re-entrant `synchronize` after an `await` inside the block. A sync stack alone
cannot do that: a non-async block that returns a promise loses the owner after
its first `await`, and a nested `synchronize` then waits on itself (deadlock).
trails#10093 solved the same problem for `kernelCatch` by having the caller say
the block is sync (`kernelCatchSync`, used by `ActiveSupport::Callbacks` sync
chains). Ruby: `vendor/ruby/v3.3.11/ext/monitor/lib/monitor.rb:200`.

## Acceptance criteria

- Callers that know their block is sync (connection pool, callbacks) enter the
  monitor without an `AsyncLocalStorage.run`, and re-entrancy semantics are unchanged.
- `monitor` tests stay green, and a new test covers re-entry from a sync block.
- `Map` allocations under `monSynchronize` fall below 0.5% of bytes under the
  twelve-dollar load.
