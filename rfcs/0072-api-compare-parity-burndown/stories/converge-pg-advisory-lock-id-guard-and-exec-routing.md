---
title: "Add Rails' advisory-lock id ArgumentError guard and settle the pinned-client routing deviation"
status: draft
updated: 2026-07-27
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while shipping #5410 (`converge-pg-session-and-transaction-exec-primitive-routing`,
RFC 0072). Two entries were left baselined in
`scripts/api-compare/call-mismatches-wide-exclude/activerecord/connection-adapters/postgresql-adapter.json`
with a `Deliberate deviation` reason rather than converged, because fixing them
is a behaviour change that did not belong in an exec-routing PR.

Rails (`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:459-471`):

```ruby
def get_advisory_lock(lock_id) # :nodoc:
  unless lock_id.is_a?(Integer) && lock_id.bit_length <= 63
    raise(ArgumentError, "PostgreSQL requires advisory lock ids to be a signed 64 bit integer")
  end
  query_value("SELECT pg_try_advisory_lock(#{lock_id})")
end
```

`release_advisory_lock` is the mirror with `pg_advisory_unlock`.

trails (`packages/activerecord/src/connection-adapters/postgresql-adapter.ts`,
`getAdvisoryLock` / `releaseAdvisoryLock`, plus the `_pgAdvisoryLockSql` helper
at the bottom of the file) diverges on two axes:

1. It issues the query on the pinned raw client via `_acquireFreshClient()` +
   `_serializePinnedQuery()` instead of `queryValue`. This one is arguably
   _load-bearing_: PG advisory locks are session-scoped, so the lock must be
   taken on the connection the caller actually holds, and `queryValue` routes
   through `selectAll`, which can materialize a different connection. Any
   convergence has to prove the session identity still holds before swapping
   the primitive — do not do it mechanically.
2. It silently accepts `string` and `bigint` lock ids, hashing strings through
   `hashtext($1)`. Rails raises `ArgumentError` for anything that is not an
   Integer of <= 63 bits. This axis has no such justification and is a plain
   fidelity gap.

## Acceptance criteria

- Add the Rails `ArgumentError` guard for non-integer / >63-bit lock ids, with
  Rails' exact message.
- Decide and document (at the call site, per repo convention) whether the
  pinned-client routing survives; if it does, keep the two baseline entries but
  tighten the `reason` to cite the test that pins the session-identity
  requirement. If it does not, route through `queryValue` and drop the entries.
- Either way the two `query_value` entries in the wide baseline are resolved
  (dropped or re-reasoned with evidence), and the baseline is strictly smaller
  or equal.
- Tests named verbatim after the Rails tests in
  `vendor/rails/activerecord/test/cases/adapters/postgresql/` covering the
  ArgumentError guard.
