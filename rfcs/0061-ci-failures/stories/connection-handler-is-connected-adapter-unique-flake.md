---
title: "connection-handler-is-connected-adapter-unique-flake"
status: done
updated: 2026-08-08
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6255
claim: "2026-08-08T18:04:01Z"
assignee: "connection-handler-is-connected-adapter-unique-flake"
blocked-by: null
closed-reason: null
---

> Rehomed from `0028-ci-cost-optimization` when that RFC was closed; scope unchanged.

## Context

Surfaced by `pg-maria-adapter-unique-flake-burndown-round-2` triage. Run
[30601215884](https://github.com/blazetrailsdev/trails/actions/runs/30601215884)
(branch `tests-materialize-sqlite-files-in-repo-root-13fe`, 2026-07-31T03:17Z)
failed on **both** `Active Record PostgreSQL Tests (2)` and
`Active Record MariaDB Tests (2)` — and on neither SQLite shard — with:

```text
FAIL packages/activerecord/src/connection-adapters/connection-handler.test.ts
  > ConnectionHandlerTest > is connected
AssertionError: expected false to be true // Object.is equality
```

That is `connection-handler.test.ts:539`:

```ts
const pool = handler.retrieveConnectionPool("primary")!;
await (await pool.leaseConnection()).verifyBang();
expect(handler.isConnected("primary")).toBe(true);
```

`ConnectionHandler#isConnected`
(`connection-adapters/abstract/connection-handler.ts:244-249`) delegates to
`ConnectionPool#isConnected`
(`connection-adapters/abstract/connection-pool.ts:584-585`), which is
`this._connections.some((conn) => conn.isConnected())` — the faithful port of
`connection_pool.rb:427-429`. `AbstractAdapter#isConnected`
(`abstract-adapter.ts:1254`) is `this._connection !== null`, faithful to
`abstract_adapter.rb:649-651`.

So on the PG/MySQL lanes, after a successful `verifyBang()` the leased adapter's
`_connection` was null, or the leased adapter was not in `pool._connections`.
Neither is possible on the SQLite lane, which is why this is adapter-unique.
Unreproduced locally; it has been seen once.

## Acceptance criteria

- [ ] Root cause identified: either `verifyBang()` leaves `_connection` null on
      a PG/MySQL adapter under some ordering, or `leaseConnection()` can hand
      back an adapter that `_connections` does not hold.
- [ ] The divergence is converged against `connection_pool.rb` /
      `abstract_adapter.rb` rather than the test being loosened — `is connected`
      keeps its Rails name and its assertion.
- [ ] If the cause proves to be per-worker slot-DB scheduling rather than a port
      divergence, close with the evidence and a note in the CI-flake register
      instead.
