---
title: "schemaCache returns the raw cache, not Rails' bound reflection, forcing a second schemaCacheBound accessor"
status: ready
updated: 2026-07-27
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Real Rails deviation surfaced by `extra-surface-adapter-cross-file-recurring-names`
(PR 5345), currently carrying 1 allowlist entry in
`scripts/api-compare/extra-surface-allow.json`.

Rails' `AbstractAdapter#schema_cache` returns the pool's bound reflection handle:

- `vendor/rails/activerecord/lib/active_record/connection_adapters/abstract_adapter.rb:298`
  — `def schema_cache` delegating to the pool
- `vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/connection_pool.rb:285`

trails' `AbstractAdapter#schemaCache` getter instead returns the **raw**
`SchemaCache` that the adapter memoizes incidental introspection into, so the
Rails-shaped bound handle needs a second name, `schemaCacheBound`
(`connection-adapters/abstract-adapter.ts`). The real divergence is
`schemaCache`'s return type; `schemaCacheBound` is the workaround.

Consumers of the bound handle today: `packages/activerecord/src/insert-all.ts:503`
and `:527`, and the uniqueness validator
(`packages/activerecord/src/validations/uniqueness.ts:346` documents why it needs
the bound handle: `addIndex` invalidates only the raw cache).

Converging means making `schemaCache` return `BoundSchemaReflection` as Rails
does and giving the raw memo an internal name, then deleting `schemaCacheBound`.
Phase 11 already moved the raw `SchemaCache` to `pool.poolConfig.schemaCache`
(matching Rails' PoolConfig `@schema_cache` slot), so the pieces are in place.

Check the related parked work before starting: `schema-cache-warming-converges-
partial-decl` and `extra-surface-schema-cache-and-pool-sync-api` (RFC 0072), plus
the note that the schema-cache pool target must be `realPool` not the bare pool.

## Acceptance criteria

- `schemaCache` returns the Rails-shaped bound handle; the raw memo is reachable
  under an internal name that does not read as public surface.
- `schemaCacheBound` is deleted and its allowlist entry removed.
- `insertAll` and the uniqueness validator keep the semantics their existing
  comments pin — in particular that `addIndex` invalidation is still observed.
- Scoped `vitest run` on insert-all, uniqueness, and schema-cache tests passes.
