---
title: "ExecutorHooks.run warm step converges back to Rails' no-op"
status: draft
updated: 2026-11-18
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#10318 added a warm step to `ConnectionPool::ExecutorHooks.run`
(`packages/activerecord/lib/connection-adapters/abstract/connection-pool.ts`). In Rails `run` is
a no-op (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/connection_pool.rb:194-196`).
The warm step verifies a connection on every pool that has a loaded `SchemaReflection#_cache` and
no connection. It exists because `PostgreSQL::Quoting#lookup_cast_type_from_column`
(`postgresql/quoting.rb:189-192`) runs `verify! if type_map.nil?` in line, and the trails body
(`lib/connection-adapters/postgresql/quoting.ts`, `lookupCastTypeFromColumn`) cannot await it.
The sync caller is `_defaultAttributes`, which peeks the warm schema cache through
`withConnectionSync` on a fresh lease.

Costs that remain:

- A request that never touches the DB still connects a flushed pool that has a warm cache.
- A DB outage fails every request at the start, not only the requests that touch a model.

## Acceptance criteria

- `ExecutorHooks.run` goes back to Rails' no-op, and `SchemaReflection#_cache` goes back to private.
- A fresh lease of a never-connected PostgreSQL adapter reaches `lookupCastTypeFromColumn` with a
  loaded type map and no request-time warm step. For example: the pool hands out a connection
  that was verified during an awaited checkout, or the sync peek is reached only from a caller
  that awaited a checkout first.
- `test/cases/adapters/postgresql/executor-warm.trails.test.ts` still passes, and is renamed or
  retargeted to the converged path.
- The third warm step in packages/activerecord/CLAUDE.md § "Adapter facts are prewarmed and
  peeked" is removed or replaced.
