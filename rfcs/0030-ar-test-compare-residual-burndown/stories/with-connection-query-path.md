---
title: "with-connection-query-path"
status: in-progress
updated: 2026-06-17
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 50
pr: 3564
claim: "2026-06-17T18:24:42Z"
assignee: "with-connection-query-path"
blocked-by: null
---

## Context

Surfaced by `e3-connection-handling` (RFC 0030). The `connection_handling_test.rb`
test **"common APIs don't permanently hold a connection when permanent checkout
is deprecated or disallowed"** remains `it.skip` in
`packages/activerecord/src/connection-handling.test.ts` because internal query
execution acquires its connection through the **deprecated `Model.connection`
getter**, which calls `pool.leaseConnection()` and makes the lease
sticky/permanent.

- `relation.ts` read paths reach for `this._modelClass.connection` directly
  (e.g. `relation.ts:2438`, `:2626`, `:3404`, and the count/exists paths).
- `persistence.ts` insert wraps `doInsert` in `withConnection`, but the SQL
  building inside still touches `ctor.connection` for quoting/schema, which
  flips the lease to sticky via `connection-handling.ts:384` (`connection()` →
  `pool.leaseConnection()` under `permanent_connection_checkout = :deprecated |
:disallowed`).

Net effect: after `Post.create!` / `Post.first` / `Post.count`, the pool still
reports `active_connection?` truthy, whereas Rails releases it because common
APIs run inside `with_connection`.

## Acceptance criteria

- [ ] Internal query execution (relation read paths + persistence insert SQL
      building) acquires its connection via `withConnection` rather than the
      deprecated permanent `.connection` lease, under
      `permanent_connection_checkout = :deprecated | :disallowed`.
- [ ] Un-skip "common APIs don't permanently hold a connection when permanent
      checkout is deprecated or disallowed" in `connection-handling.test.ts`
      (the test body already exists, skipped, with the ROOT-CAUSE tag) and it
      passes against the canonical SQLite adapter.
- [ ] No regression in the existing `ConnectionHandlingTest` cases that assert
      `#connection` / `#lease_connection` deprecation/disallowed behavior.
