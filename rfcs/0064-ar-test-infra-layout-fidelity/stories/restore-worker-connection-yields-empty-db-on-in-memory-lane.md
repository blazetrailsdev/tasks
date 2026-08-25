---
title: "restoreWorkerConnection yields an empty DB on the in-memory lane"
status: done
updated: 2026-07-31
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 5692
claim: "2026-07-31T00:12:08Z"
assignee: "restore-worker-connection-yields-empty-db-on-in-memory-lane"
blocked-by: null
closed-reason: null
---

## Context

`restoreWorkerConnection()` (`packages/activerecord/src/connection-handling.test.ts:25`)
is `Base.establishConnection("arunit")` — the shield PR #5415 added for tests
that displace `Base`'s pool, mirroring `support/connection.rb:32`. Under
`ARCONN=sqlite3_mem` it does not restore anything: re-establishing hands the
worker a brand-new, EMPTY in-memory database, since the schema lived in the
connection that was just discarded.

PR #5658 worked around this by gating every case that calls it inside
`ConnectionHandlingTest` behind `it.skipIf(inMemoryDb())`, which costs
in-memory-lane coverage for three trails-only cases:

- `establish_connection with a url stores a UrlConfig with discrete fields`
- `remove_connection removes the pool`
- `remove_connection returns undefined when no pool exists`

The same hazard remains live in `AbstractAdapter#isPreventingWrites stack
matching`, whose `afterEach` restores unconditionally on every lane.

## Acceptance criteria

- `restoreWorkerConnection` (or its replacement) leaves the worker with a
  schema-bearing connection on the in-memory lane — e.g. by reloading the
  canonical schema after re-establishing, or by making the displacing tests
  restore the exact pool object they removed rather than reconnecting.
- The three cases above drop their `it.skipIf(inMemoryDb())` gates.
- `ARCONN=sqlite3_mem` stays green for `connection-handling.test.ts` and for a
  sibling file sharing the same worker.
