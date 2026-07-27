---
title: "reflectionAdapter cold-pool fallback still flips the lease permanent"
status: draft
updated: 2026-07-27
rfc: "0073-permanent-connection-checkout-disallowed"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #5446 routed `reflectionAdapter`
(`packages/activerecord/src/model-schema.ts:41`) off the deprecated
`Model.connection` getter. It now resolves
`threadedConnectionFor(klass) ?? klass._adapter ?? (pool.activeConnection ?? pool.leaseConnectionSync())`.

One residual remains. `leaseConnectionSync`
(`packages/activerecord/src/connection-adapters/abstract/connection-pool.ts:678`)
unconditionally sets `lease.sticky = true`, so for a genuinely cold pool — no
threaded connection, no directly-assigned `_adapter`, no `activeConnection` —
a schema-reflection read still flips the lease permanent. That is the same
outcome the old getter produced via its `isPermanentLease()` branch, so #5446
is not a regression, but it is not a full fix either.

Rails never leases for reflection: `schema_cache.rb` (`columns_hash`,
`data_source_exists?`, `primary_keys`) wraps every cold read in
`pool.with_connection`, and `model_schema.rb` (`load_schema!` and friends)
takes the connection as the `with_connection` block parameter. A `with_connection`
checkout is transient (`ConnectionPool#withConnection` sets `sticky = false` and
releases on done); a sync lease is not.

The obstacle is that the reflection call sites are synchronous
(`buildPkWhere`, `quotedTableName`, `cachedTableExists`,
`loadSchemaFromCacheSync`, `cachedColumnNames`) while trails' Rails-named
`leaseConnection`/`checkout` are async (they await per-checkout `verifyBang`),
so no sync transient checkout exists today. Options to weigh: make the cold
path release after the synchronous read, give the pool a sync
transient-checkout helper that restores `lease.sticky`, or convert the
remaining sync reflection call sites to async so they can use
`pool.withConnection`.

## Acceptance criteria

- A cold-pool schema-reflection read no longer leaves the lease permanent
  (`pool.isPermanentLease()` stays true / no sticky lease is left behind), or
  the remaining sync lease is justified at the call site against Rails source.
- The `try`/`catch` call sites keep their throw-and-swallow contract
  (`connectionPool` still raises `ConnectionNotEstablished` for a pool-less
  model).
- A regression test covers the cold-pool path and fails on the pre-fix
  baseline.
- Existing tests stay green.
