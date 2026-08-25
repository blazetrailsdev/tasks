---
title: "pool.disconnect() resolves before the PG socket drains, forcing an explicit close in withSecondAdapter"
status: done
updated: 2026-08-08
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: 6214
claim: "2026-08-08T01:26:09Z"
assignee: "connection-pool-disconnect-returns-before-the-driver-drains"
blocked-by: null
closed-reason: null
---

## Context

`withSecondAdapter` (`packages/activerecord/src/support/second-connection.ts`,
PR #6210) checks its adapter back in and then closes it **explicitly** before
`pool.disconnect(false)`:

```ts
pool.checkin(adapter);
await adapter.close().catch(() => {});
...
await pool.disconnect(false).catch(() => {});
```

`ConnectionPool#disconnect` already awaits each connection's drain
(`packages/activerecord/src/connection-adapters/abstract/connection-pool.ts:972-994`),
so the explicit close should be redundant — and in Rails, `pool.checkin` plus
the pool's own teardown is the whole story
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/connection_pool.rb`).

It is not redundant in practice. Without it, the PG lane fails
`translate no connection exception to not established`
(`packages/activerecord/src/adapters/postgresql/postgresql-adapter.test.ts:719`):
that test terminates the FIRST adapter's backend from inside the block, and the
subsequent `adapter.execute("SELECT 1")` surfaces `ConnectionNotEstablished`
("terminating connection due to administrator command") instead of the expected
`ConnectionFailed`. The extra awaited close changes when the termination lands
on the first adapter's client. Verified locally against PG 17.

That means `disconnect()` is returning before the driver socket is actually
drained, which is a pool-teardown fidelity question, not a test-helper one —
`disconnect` is supposed to be the awaitable teardown.

## Converged shape

Find out why `ConnectionPool#disconnect` returns before the connection is drained
(compare `_disconnect` / `disconnectBang` / `close` on `PostgreSQLAdapter` — the
memory note `project_execute_mutation_split_is_the_deviation` and
`project_sync_active_getter_drops_rails_live_probe` are adjacent), fix the drain
so `await pool.disconnect()` genuinely means "closed", and delete the explicit
`adapter.close()` from `withSecondAdapter`. If the ordering turns out to be
inherent to node-pg's async error delivery rather than a drain bug, say so at
the call site with the driver cite and keep the close — but establish which it
is rather than leaving the comment as the answer.

## Acceptance criteria

- [ ] `await pool.disconnect()` drains its connections before resolving, or the
      gap is documented against a node-pg behaviour with a cite.
- [ ] `withSecondAdapter` no longer needs an explicit `adapter.close()`, or the
      need is justified at the call site by that cite.
- [ ] `translate no connection exception to not established` and
      `PostgreSQLAdapter#active > returns false once the backend behind a live
client is terminated` stay green on the PG lane. No test renamed.
