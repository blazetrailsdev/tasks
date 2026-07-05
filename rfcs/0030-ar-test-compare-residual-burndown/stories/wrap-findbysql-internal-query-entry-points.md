---
title: "Wrap findBySql/countBySql (raw-SQL query entry points) in withQueryConnection"
status: ready
updated: 2026-07-05
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Follow-up to `thread-yielded-connection-internal-query-path` (PR #3876).
`with-connection-query-path` (#3564) and #3876 wrapped the common relation /
calculation / transaction / persistence entry points in `withQueryConnection`
(plain `with_connection` + connection threading) so they release the pool
connection under `permanent_connection_checkout = :deprecated | :disallowed`.

`querying.ts` `findBySql` (and `countBySql`) were NOT converted — they read
`this.connection.execute` / `this.connection.selectAll` directly
(querying.ts ~lines 87, 123) with no `withQueryConnection` wrap, so they neither
thread the connection nor release the lease the way `first` / `count` / `create!`
now do. Audit `querying.ts` and any other internal query entry points that issue
SQL outside a wrap (e.g. raw `find_by_sql`-style paths) and converge them.

## Acceptance criteria

- [ ] `findBySql` / `countBySql` (and any sibling raw-SQL query entry points)
      run inside `withQueryConnection` and read the threaded connection via
      `currentQueryConnection()` / `threadedConnectionFor`, not the deprecated
      getter.
- [ ] Under `permanent_connection_checkout = :deprecated | :disallowed` these
      APIs release the pool connection (no permanent lease), matching Rails.
- [ ] No api:compare / test:compare regression.
