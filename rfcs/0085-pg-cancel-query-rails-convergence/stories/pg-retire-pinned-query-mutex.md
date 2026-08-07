---
title: "Retire _serializePinnedQuery/_maintenanceTail in favour of the lock"
status: done
updated: 2026-08-07
rfc: "0085-pg-cancel-query-rails-convergence"
cluster: null
deps: ["pg-lock-scope-no-escaping-queries"]
deps-rfc: []
est-loc: 350
priority: null
pr: 6189
claim: "2026-08-07T17:53:00Z"
assignee: "user-input-in-time-zone-utc-fallback-is-not-rails-zoneless-arm"
blocked-by: null
closed-reason: null
---

## Context

`_serializePinnedQuery` + `_maintenanceTail` (`postgresql-adapter.ts` ~1480) are
a per-query mutex over the pinned `pg.Client`: every `client.query` chains onto
one tail so no two overlap, because "two calls that interleave desync the wire
protocol". Rails has no such construct — `@lock.synchronize` around
`with_raw_connection` (`abstract_adapter.rb:984`) is its only serializer, and it
is sufficient because no query escapes the lock scope.

Once `pg-lock-scope-no-escaping-queries` establishes that invariant in trails,
this mutex is serializing something that is already serialized. RFC 0061
`pg-in-flight-marker-regression-coverage` demonstrated the redundancy from the
other direction: no test could distinguish a correct from an incorrect
`_queryInFlight` claim site, because two independent barriers (the tail drain in
`awaitRawConnectionReady`, ~1428, and the TransactionManager lock) already
prevent the overlap — the same job done twice.

`_maintenanceTail` also carries the maintenance ops (DEALLOCATE / ROLLBACK /
DISCARD ALL via `_enqueueMaintenance`) and the `awaitRawConnectionReady` pre-loop
drain, so removal is not a straight deletion: those orderings must be re-expressed
inside the lock scope. Rails' equivalents run inline under the lock (e.g.
`StatementPool#[]=` deallocates the evicted entry inline before the new query is
sent — `statement_pool.rb:31`, `postgresql_adapter.rb:307`).

## Dependencies

Blocked on `pg-lock-scope-no-escaping-queries`. Landing this first re-opens the
wire-desync bug it was written to prevent.

## Acceptance criteria

- `_serializePinnedQuery`, `_maintenanceTail`, and `_queryInFlight` are gone,
  with their ordering guarantees re-expressed as lock-scoped/inline work.
- The `awaitRawConnectionReady` tail drain (~1428) is removed or reduced to the
  reset barrier it also carries.
- The prepared-statement eviction ordering (DEALLOCATE lands on an idle client
  before the query that triggered the eviction) still holds, matching Rails'
  inline deallocate.
- No `client.query() ... already executing a query` deprecation appears in a
  full PG lane run.
