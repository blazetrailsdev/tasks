---
title: "ConnectionPool#active_connection? is a getter returning the adapter, not a predicate"
status: draft
updated: 2026-09-19
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced converging `connection_pool_test.rb` (trails#7885). Rails `activerecord/lib/active_record/connection_adapters/abstract/connection_pool.rb` defines the predicate `active_connection?` (`connection_pool.rb:~370`, `@leases[...]` lookup returning a boolean). trails has no `isActiveConnection()`: `ConnectionPool` (`packages/activerecord/src/connection-adapters/abstract/connection-pool.ts:361`) exposes a `get activeConnection(): DatabaseAdapter | null` getter instead, which returns the leased adapter. The ported tests (`connection-pool.test.ts` "active connection in use", "active connection?", "pin connection always returns the same connection") assert `pool.activeConnection` truthy/falsy where Rails uses `assert_predicate @pool, :active_connection?`.

## Acceptance criteria

- `ConnectionPool#isActiveConnection()` exists, ported from `active_connection?`; the `activeConnection` getter is removed or renamed onto whatever Rails calls the leased-connection reader (check `connection_pool.rb` for a non-predicate counterpart before deciding).
- Callers and the ported tests use the predicate.
