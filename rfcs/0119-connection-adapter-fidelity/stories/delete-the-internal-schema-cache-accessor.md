---
title: "Delete AbstractAdapter#internalSchemaCache once its last sync reader goes"
status: ready
updated: 2026-09-05
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 110
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`AbstractAdapter#internalSchemaCache`
(`packages/activerecord/src/connection-adapters/abstract-adapter.ts`, the
`internalSchemaCache` getter) is a trails-only accessor with no Rails
counterpart: Rails' `@schema_cache` slot holds the pool-bound
`BoundSchemaReflection`
(vendor/rails/activerecord/lib/active_record/connection_adapters/abstract_adapter.rb:298),
and every read goes through that one-arg handle.

`burn-down-internal-schema-cache-readers-onto-the-bound-handle` (PR #7135) took
every POOL-ARG-TAKING reader onto the bound handle and left the accessor
standing, exactly as that story's last acceptance criterion allowed ("deleted
when the last reader goes — may be a follow-up story if the burndown does not
fit one PR"). This is that follow-up.

What still reads it is only synchronous peeks, each carrying a call-site receipt
naming the synchronous Rails reader it answers for:

- `model-schema.ts` — `columnsHash` and `cachedColumnsHash`
  (model_schema.rb:434-441), `loadSchemaFromCacheSync` (model_schema.rb:534-546),
  `cachedTableExists` (model_schema.rb:416-418), `clearAdapterDataSourceCache`
  (model_schema.rb:507-513).
- `attribute-methods/primary-key.ts` — `cachedSchemaCacheFor`, backing the
  synchronous `primary_key` reader (primary_key.rb:114).
- `insert-all.ts` — `extractTypesFromColumnsOn` (insert_all.rb:306-313).
- `support/schema-cache-dump.ts` — the one genuine PERMANENT: its fingerprint is
  taken off `marshal_dump`, which Rails puts on `SchemaCache` alone
  (schema_cache.rb:416-418); `BoundSchemaReflection` (schema_cache.rb:150-200)
  has no counterpart, so there is no one-arg form to converge onto in either
  language. This site is NOT a burndown straggler and must not be "converged".

Every other reader is downstream of one fact — trails' bound reflection reads are
async where Rails' block on a checkout — which is what
`retire-schema-cache-sync-readers-after-checkout-flip` (RFC 0073) removes. That
story retires the `getCached*` readers on `schema-cache.ts` but says nothing
about this accessor, so without this story the accessor outlives its last caller.

## Converged shape

Once RFC 0073 has flipped the reflection reads synchronous and
`retire-schema-cache-sync-readers-after-checkout-flip` has removed the
`getCached*` peeks, every remaining caller reads
`this.schemaCache.<x>(tableName)` — the pool-bound handle, one argument — and
the `internalSchemaCache` getter is DELETED from `abstract-adapter.ts` along with
its `@noRailsEquivalent CONVERGEABLE` tag, leaving `schemaCache`
(abstract_adapter.rb:298) as the only adapter-level accessor, as in Rails.

`support/schema-cache-dump.ts` is the one caller that cannot move; it is test
tooling outside both compare populations, so the accessor can instead be reduced
to a non-exported read there, or that file taught to hold the raw cache it
already builds.

## Acceptance criteria

- [ ] No non-test reader of `internalSchemaCache` remains outside
      `support/schema-cache-dump.ts`.
- [ ] The `internalSchemaCache` getter is gone from `abstract-adapter.ts`.
- [ ] `parity:api:extra --package activerecord` novel/total both drop; the mark
      is tightened, never raised.
- [ ] `UniquenessValidationWithIndexTest` stays green (the shared-slot canary
      from PR #5906).
