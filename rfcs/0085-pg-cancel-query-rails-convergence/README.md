---
rfc: "0085-pg-cancel-query-rails-convergence"
title: "Converge PG query cancellation and serialization on Rails"
status: draft
created: 2026-07-31
updated: 2026-08-10
owner: "@deanmarano"
packages:
  - "activerecord"
clusters: []
priority: 3
---

## Problem

`PostgreSQLAdapter` carries a cluster of query-serialization inventions with no
Rails counterpart:

- `_queryInFlight` — a boolean tracking whether a query is on the wire.
- `_queryInFlightOwner` — the `TransactionManager` lock token of the chain that
  issued it, so `_cancelAnyRunningQuery` can tell "my query" from someone
  else's.
- `_serializePinnedQuery` / `_maintenanceTail` — a per-query mutex over the
  pinned `pg.Client`, because two `client.query` calls that interleave desync
  the wire protocol.

Rails has none of them. `cancel_any_running_query`
(`activerecord/lib/active_record/connection_adapters/postgresql/database_statements.rb:127`)
is three lines:

```ruby
def cancel_any_running_query
  return if @raw_connection.nil? || IDLE_TRANSACTION_STATUSES.include?(@raw_connection.transaction_status)
  @raw_connection.cancel
  @raw_connection.block
rescue PG::Error
end
```

It reads the connection's own libpq protocol state rather than tracking
anything, and it needs no ownership concept because `@lock.synchronize` wraps
the entire `with_raw_connection` body (`abstract_adapter.rb:984`): one query is
on the wire at a time, and it belongs to the thread that is rolling back.

Every invention above is compensation for one root divergence, already stated in
trails' own comment at `_cancelAnyRunningQuery`: **trails' lock is per async
chain, and a chain can release it with work still awaiting.** Queries escape the
lock, so they collide (hence the serializer) and so ownership becomes unprovable
(hence the token).

The cost is not only surface area. The inventions have no observable contract:
RFC 0061 `pg-in-flight-marker-regression-coverage` was closed `wontfix` after
proving that no construction discriminates the correct marker placement from the
buggy one (#5660, #5667) — the two barriers that defeat every attempt are the
connection lock doing the serializer's job twice. Meanwhile the divergence
produces real failures: the `pg-query-canceled-unhandled-rejection` flake class
exists because trails fires a CancelRequest and never drains the cancelled
query, where Rails' `raw_connection.block` waits for it.

## Approach

Port the Rails mechanisms, then delete the stand-ins. In dependency order:

1. **`transaction_status` port.** `pg-protocol` parses the ReadyForQuery status
   byte into `ReadyForQueryMessage.status` ('I' / 'T' / 'E'), emitted on
   `client.connection` — so the byte trails claims is unavailable
   (`postgresql-adapter.ts` `isRetryableQueryError`) is in fact reachable with
   no new dependency. Gives a faithful `IDLE_TRANSACTION_STATUSES` gate,
   restores the omitted `PQTRANS_INERROR` guard in `isRetryableQueryError`, and
   retires `_queryInFlight`.
2. **`raw_connection.block` port.** Await the cancelled query's rejection
   instead of orphaning it, closing the unhandled-rejection flake class at its
   source rather than by narrowing the cancel.
3. **Close the lock leak.** No query may outlive the `withRawConnection` scope
   that issued it. With that invariant, `_queryInFlightOwner` is dead code.
4. **Retire the per-query mutex.** Once (3) holds, `@lock` is the only
   serializer Rails has and the only one trails needs — `_serializePinnedQuery`
   and `_maintenanceTail` collapse into it.

Steps 1 and 2 are self-contained, individually testable, and convergent whether
or not (3) lands. Step 3 is the load-bearing one and has callers to convert
(the fire-and-forget / abandoned-query pattern), so it is sized as its own
story. Step 4 is the payoff and strictly follows (3).

## Non-goals

- Changing the async-chain lock into a global mutex. The reentrant per-chain
  lock mirrors Rails' `Monitor` reentrancy; the divergence is the early
  release, not the granularity.
- Reviving a regression test for the #5660 marker placement. It is untestable
  by construction, and step 3 deletes the thing it would have tested.
