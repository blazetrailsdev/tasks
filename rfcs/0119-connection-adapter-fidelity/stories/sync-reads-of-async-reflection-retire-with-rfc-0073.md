---
title: "sync-reads-of-async-reflection-retire-with-rfc-0073"
status: blocked
updated: 2026-09-04
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-09-04T17:20:47Z"
assignee: "sync-reads-of-async-reflection-retire-with-rfc-0073"
blocked-by: "RFC 0073 (permanent-connection-checkout-disallowed) has not landed: all 16 of its stories are still ready, including retire-schema-cache-sync-readers-after-checkout-flip and arm-permanent-connection-checkout-disallowed. The six remaining CONVERGEABLE receipts in abstract-adapter.ts, abstract/connection-pool.ts and abstract/query-cache.ts only retire as those counterparts land."
closed-reason: null
---

## Context

A cluster of `@noRailsEquivalent` members exists only because the port's
reflection and connection checkout are async where Ruby's are synchronous, so a
query-free "sync" twin sits beside the real reader:

- `connection-adapters/schema-cache.ts` — query-free reads of `columns_hash`
  (schema_cache.rb:352), `data_source_exists?` (:309), `primary_keys` (:298),
  their shared write half (Ruby populates only through `#add`, :326), the raw
  cache slot `SchemaReflection` keeps (:16) with its writer, the `load!`/`add_all`
  pairing (:27/:220), and its bound counterpart (:169)
- `connection-adapters/abstract/connection-pool.ts` — the pre-async
  `#lease_connection` (connection_pool.rb:315-319), the synchronous `require` of
  `ConnectionAdapters.resolve` (connection_adapters.rb:34-39), and the async
  drains added to `#discard!` (:484) and `conn.disconnect!` (:530)
- `connection-adapters/abstract-adapter.ts` — the raw schema-cache slot behind
  `#schema_cache` (abstract_adapter.rb:298)
- `connection-adapters/abstract/query-cache.ts` — the per-context query-cache
  store Ruby drops with the thread's `IsolatedExecutionState`
  (abstract/query_cache.rb:62)

Each retires with the pool sync/async convergence (RFC 0073).

## Acceptance criteria

- Each member is deleted as its RFC 0073 counterpart lands, along with its
  `@noRailsEquivalent CONVERGEABLE sync-reads-of-async-reflection-retire-with-rfc-0073`
  receipt.
- No new sync twin is added beside an async reader.
