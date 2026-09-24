---
title: "ConnectionHandling resolves its pool via this.connectionPool(); drop HABTM's _connectionSpecificationName override"
status: done
updated: 2026-09-24
rfc: "0152-pool-checkout-async-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: 60
pr: trails#8048
claim: "2026-09-24T18:23:26Z"
assignee: "connection-handling-dispatches-through-connection-pool"
blocked-by: null
closed-reason: null
---

## Context

Rails resolves every `ConnectionHandling` entry point through the `connection_pool` _method_, so a
subclass that overrides `self.connection_pool` redirects all of them:

- `connection_handling.rb:269-271` `lease_connection` is `connection_pool.lease_connection`.
- `connection_handling.rb:274-290` `connection` does `pool = connection_pool`.
- `release_connection` and `with_connection` (`:296-311`), `connection_db_config`, `adapter_class`
  and `schema_cache` do the same.
- The HABTM join model relies on this: `associations/builder/has_and_belongs_to_many.rb:45-47`
  defines only `def self.connection_pool; left_model.connection_pool; end`.

trails' `packages/activerecord/src/connection-handling.ts` calls the module function directly,
`connectionPool.call(this)` (`leaseConnection`, `releaseConnection`, `withConnection`,
`connectionDbConfig`, `connection`, `adapterClass`, `adapterClassSync`, `schemaCache`). So an
override of `static connectionPool()` is never consulted. To make the join model resolve the left
model's pool anyway, `associations/builder/has-and-belongs-to-many.ts` defines an invented
`_connectionSpecificationName` getter/no-op setter on the join model (the `Object.defineProperty(joinModel,
"_connectionSpecificationName", …)` block near `:100`), beside its faithful
`static connectionPool()` forward (`:79-81`). trails#8021 removed the sibling invented `connection`
and `adapter` getters.

## Acceptance criteria

- Each `ConnectionHandling` entry point resolves its pool through `this.connectionPool()`, as Rails'
  bodies call `connection_pool`.
- The HABTM join model's `_connectionSpecificationName` override is deleted. It resolves the left
  model's pool through `static connectionPool()` alone, matching `has_and_belongs_to_many.rb:45-47`.
- HABTM tests (`has-and-belongs-to-many-associations.test.ts`, the join-model/through tests) stay
  green on sqlite, PG and MySQL, including a left model on a non-primary connection class.
