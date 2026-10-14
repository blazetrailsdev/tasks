---
title: "Mysql2Adapter#activeAsync skips verified! on a successful ping"
status: closed
updated: 2026-10-14
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages:
  - "activerecord"
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "rfc-refine 0189 (2026-10-14, trails origin/main 03da862b8a): Landed: origin/main connection-adapters/mysql2-adapter.ts:165 active? calls `this.verifiedBang()` on a successful ping."
---

## Context

Surfaced while reviewing PR #5966
(`mysql2-connected-predicate-folds-in-cached-ping-state`), which converged
`Mysql2Adapter#isConnected` onto Rails' `connected?`.

Rails' `Mysql2Adapter#active?`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/mysql2_adapter.rb:108`)
calls `verified!` on a successful ping, inside the lock:

```ruby
def active?
  if connected?
    @lock.synchronize do
      if @raw_connection&.ping
        verified!
        true
      end
    end
  end || false
end
```

trails' `Mysql2Adapter#activeAsync`
(`packages/activerecord/src/connection-adapters/mysql2-adapter.ts`, the async half
of `active?`) sets `_activeState = true` on a successful ping but never calls
`verifiedBang()` — which exists on the base adapter
(`connection-adapters/abstract-adapter.ts:2457`, `@internal Mirrors:
AbstractAdapter#verified!`) and IS called on the connect path
(`abstract-adapter.ts:1341-1344`, mirroring `connect_with_retry`). So a
successful liveness ping does not refresh the verified timestamp/flag the way
Rails' does, and `verifyBang` may re-verify a connection Rails would consider
freshly verified.

Check the same gap on `PostgreSQLAdapter#active` and `SQLite3Adapter#active`
before fixing — the omission may be shared across adapters.

## Acceptance criteria

- `Mysql2Adapter#activeAsync` calls `verifiedBang()` on the successful-ping path,
  matching `active?` at mysql2_adapter.rb:108-116.
- The PG / SQLite `active` implementations are audited for the same omission and
  fixed in the same PR if the deviation is identical (keep under the 500 LOC
  ceiling; split by adapter otherwise).
- A test asserting the verified state is refreshed by a successful liveness
  probe, red on baseline.
