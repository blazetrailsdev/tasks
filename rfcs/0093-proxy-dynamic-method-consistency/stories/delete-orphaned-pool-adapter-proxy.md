---
title: "Delete the orphaned ConnectionPool adapter proxy"
status: draft
updated: 2026-08-30
rfc: "0093-proxy-dynamic-method-consistency"
cluster: null
packages:
  - "activerecord"
deps: []
deps-rfc: []
est-loc: 90
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ConnectionPool#_getAdapterProxy`
(`packages/activerecord/src/connection-adapters/abstract/connection-pool.ts:318-349`)
builds a `new Proxy({} as DatabaseAdapter, …)` that fabricates a dispatcher for
every member name a real connection exposes, wrapping each in
`pool.withConnection(...)`. Rails has no counterpart: the only `method_missing`
in `connection_adapters/abstract/connection_pool.rb` is `NullConfig`'s
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/connection_pool.rb:18`);
`ConnectionPool` itself exposes no adapter facade, and Rails' pool-backed
collaborators hold the pool directly
(`vendor/rails/activerecord/lib/active_record/schema_migration.rb:12-17`).

**It is now dead code.** `git grep getAdapterProxy` over `packages/` and
`scripts/` returns exactly one definition site and three test call sites that
reach in through a cast (`packages/activerecord/src/connection-pool.test.ts:548`,
`:580`, `:592`). There is no production caller. The consumers it existed for —
`SchemaMigration` / `InternalMetadata` / `MigrationContext` — were converged onto
holding a pool by #5805 and #6239 (`refactor(activerecord): Migrator drops
up/down/rollback/forward and its lock-id guards; migration collaborators hold a
pool`), which left the proxy orphaned.

This supersedes `pool-adapter-proxy-makes-sync-adapter-methods-async`, whose
acceptance criteria describe repairing this proxy's sync/async behaviour: the
sync-call trap it describes can no longer be reached from production code, so
deletion closes it rather than a rewrite. Confirm the `SchemaMigration._toSql`
shim and `tableExists` criteria in that story are independently satisfied (or
carry them into this PR) before it is retired.

The proxy also carries a real cost while it stays: it is the shape a future
caller would reach for, and it re-introduces the #5805 trap silently
(`toSql` answering a Promise, `execute` throwing on it, `tableExists`'s bare
`catch` degrading the throw into "no table").

## Acceptance criteria

- [ ] `_adapterProxy`, `_getAdapterProxy`, and the `new Proxy` at
      `connection-pool.ts:323` are deleted.
- [ ] The three tests that exist only to exercise the proxy are deleted:
      `connection-pool.test.ts` — "adapter proxy treats a probe name as the send
      it is, with no carve-out set", "adapter proxy still dispatches genuine
      adapter methods to the connection", "adapter proxy does not fabricate a
      method for an unknown probe key once a connection exists".
- [ ] Any import left unused by the deletion (`NoMethodError`,
      `adapterNameFromConfig`, `AbstractAdapter`) is removed only if no other
      member in the file uses it.
- [ ] `pnpm parity:api:extra --package activerecord` does not regress; the
      deletion should reduce, not raise, activerecord's novel-surface count.
- [ ] `pnpm vitest run packages/activerecord/src/connection-pool.test.ts
    packages/activerecord/src/connection-pool.trails.test.ts` is green.
- [ ] `pool-adapter-proxy-makes-sync-adapter-methods-async` is dispositioned via
      a `tasks` verb (not a hand edit) once this lands.
