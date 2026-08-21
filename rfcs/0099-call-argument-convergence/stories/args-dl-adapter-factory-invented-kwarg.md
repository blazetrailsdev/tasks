---
title: "Remove the invented adapterFactory kwarg from PoolConfig construction"
status: in-progress
updated: 2026-08-21
rfc: "0099-call-argument-convergence"
cluster: api-compare
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6823
claim: "2026-08-21T14:48:15Z"
assignee: "args-dl-adapter-factory-invented-kwarg"
blocked-by: null
closed-reason: null
---

## Context

Two `kind: "args"` rows in
`activerecord/src/connection-adapters/abstract/connection-handler.ts` where the
port passes an `adapterFactory` keyword argument Rails does not have:

- `establish_connection` → `resolve_pool_config(config, ownerName, role, shard, { adapterFactory })`
  where Rails calls `resolve_pool_config(config, connection_name, role, shard)`
  (`connection_handler.rb:275`).
- `resolve_pool_config` → `new PoolConfig(ownerName, dbConfig, role, shard, { adapterFactory })`
  where Rails calls `ConnectionAdapters::PoolConfig.new(connection_name, db_config, role, shard)`
  (`connection_handler.rb:279`).

This is invented surface threaded through the pool constructor: Ruby resolves
the adapter class by name at connection time, so no factory is passed. It is
the only invented-kwarg pair left in the data layer, and it has survived every
convergence wave since 2026-08-11 — an argument that becomes load-bearing the
longer it sits.

Note the second row also carries a `naming` component (`connectionName` →
`ownerName`); that half belongs to RFC 0096 and should not be renamed here
unless it falls out of the same edit.

## Acceptance criteria

- `adapterFactory` is removed from both call sites, or the reason it cannot be
  is recorded at the call site with `@noRailsEquivalent` naming the TS
  language shortcoming (ESM has no autoloaded constant lookup) rather than a
  baseline row.
- Both `kind: "args"` rows deleted by hand from the exclude tree.
- `pnpm parity:api:calls:args` green.
