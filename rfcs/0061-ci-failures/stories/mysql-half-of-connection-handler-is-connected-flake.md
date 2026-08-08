---
title: "The MariaDB half of ConnectionHandlerTest#is connected is still unexplained"
status: done
updated: 2026-08-08
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 5705
claim: "2026-08-08T18:44:42Z"
assignee: "mysql-half-of-connection-handler-is-connected-flake"
blocked-by: null
closed-reason: null
---

## Context

PR #6255 closed `connection-handler-is-connected-adapter-unique-flake` by
converging the PostgreSQL half: `PostgreSQLAdapter#_rawConnectionFinished`
counted node-pg's `_queryable === false` / `_connectionError === true` as
libpq `finished?`, where ruby-pg's `finished?` is true only after `PQfinish`
(`activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:343`
— `connected?` is `!(@raw_connection.nil? || @raw_connection.finished?)`, and
`active?` at :347-356 is the predicate that asks the server). A backend killed
underneath a live handle therefore flipped trails' `connected?` false where
Rails' stays true.

That explains the PG lane of run
[30601215884](https://github.com/blazetrailsdev/trails/actions/runs/30601215884).
It does **not** explain the MariaDB lane, which failed the same
`ConnectionHandlerTest > is connected` assertion in the same run.

What was ruled out on the MySQL side while the PG fix was being built:

- `Mysql2Adapter#isConnected` (`mysql2-adapter.ts:163-165`) is
  `_client !== null && !_permanentlyClosed && !_isFakeConnection`, and
  `_permanentlyClosed` is set **only** by the explicit `close()`
  (`mysql2-adapter.ts:1639`) — which does mirror
  `@raw_connection.closed?` (`mysql2_adapter.rb:104`). So MySQL has no
  analogue of the PG error-event divergence.
- Nothing nulls `_client` from an error listener; `_closeRawHandle`
  (`mysql2-adapter.ts:1585`) is reached only from `disconnectBang` and
  `reconnect`.
- `_isFakeConnection` is set only by the deprecated raw-connection ctor arm
  and the explicit `fake` option — neither is on this path.
- The pool side is adapter-independent: `ConnectionPool#isConnected`
  (`connection-pool.rb:427-429`) over `_connections`, and `checkout` pushes
  the adapter into `_connections` before `checkoutAndVerify`.

So the remaining candidate is inside `reconnectBang` →
`Mysql2Adapter#reconnect` → `_ensureClient(false)`
(`mysql2-adapter.ts:1535-1556`): some ordering in which the awaited
`_ensureClient` returns without `_client` being the live handle the assertion
then reads.

## Acceptance criteria

- [ ] Established whether `_ensureClient(false)` can return with `_client` null
      (generation bump, concurrent `_connectingPromise`, swallowed connect
      failure) after `reconnectBang` reports success.
- [ ] Any divergence found is converged against `mysql2_adapter.rb` /
      `abstract_adapter.rb#reconnect!`, not worked around in the test — `is
connected` keeps its Rails name and its assertion.
- [ ] If the MariaDB lane proves to have failed for the same environmental
      reason as PG's (a backend terminated by a sibling worker's slot-DB
      churn) with no MySQL-side divergence, close with that evidence and a
      note in the CI-flake register.
