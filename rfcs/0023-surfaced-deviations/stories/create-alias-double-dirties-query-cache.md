---
title: "create alias double-clears query cache (delegates to wrapped insert vs Rails original-body alias)"
status: draft
updated: 2026-06-14
rfc: "0023-surfaced-deviations"
cluster: rails-deviation
deps: []
deps-rfc: []
est-loc: 15
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced during PR #3256 (adapter-create-alias-missing). Rails `alias create
insert` (`database_statements.rb:203`) makes `create` a copy of the _original_
`insert` method body at alias time. After `dirties_query_cache base, ...,
:create, :insert, ...` (`query_cache.rb:13`) wraps both, calling `create` clears
the query cache once (its own wrapper) then runs the original `insert` body
directly — never re-entering the wrapped `insert`.

In trails, the `create` alias delegates via `this.insert(...)`
(`database-statements.ts:1592`). After `dirtiesQueryCache` wraps both methods on
`AbstractAdapter.prototype`, a `create` call clears the cache (create wrapper),
then calls the _wrapped_ `insert`, which clears the cache a **second** time
before running the raw insert body.

The double-clear is currently idempotent — `Store#clear` is purely
`this._map.clear()` (`query-cache.ts:97`) with no notifications or other
observable side effects — so there is no behavioral difference today. But it is a
structural divergence from Rails that would surface if cache-clearing ever gained
observable side effects (e.g. instrumentation/notifications).

## Acceptance criteria

- `create` runs the original (unwrapped) `insert` body so the cache is cleared
  exactly once per `create` call, matching Rails' alias semantics. Likely fix:
  have the `create` alias dispatch to the standalone `insert` function
  (`insert.call(this, ...)`) rather than `this.insert(...)`, so the wrapped
  `insert` is not re-entered.
- Existing `create` alias tests (delegation args/return, cache-dirtying) still
  pass; add a test asserting a single clear per `create`.
- api:compare / test:compare delta non-negative.
