---
title: "converge-schema-cache-getter-onto-bound-reflection"
status: done
updated: 2026-08-02
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 5906
claim: "2026-08-02T18:37:27Z"
assignee: "converge-schema-cache-getter-onto-bound-reflection"
blocked-by: null
closed-reason: null
---

## Context

Found by the `@noRailsEquivalent` tag audit (RFC 0080).
`connection-adapters/abstract-adapter.ts:1506` tags `schemaCacheBound`.

Rails does define the method the tag claims has no equivalent:
`abstract_adapter.rb:298` `def schema_cache` delegates to the pool's bound
reflection handle (`abstract/connection_pool.rb:285`). The tag's own prose
concedes this — it says the real divergence is `schemaCache`'s return type
"until that is converged". That makes it deferred work wearing a permanent
exception, which is exactly the pattern this audit exists to catch.

trails' `schemaCache` getter returns the raw `SchemaCache` the adapter
memoizes incidental introspection into, so the Rails-shaped bound handle needs
a second name. `insertAll` and the uniqueness validator read `schemaCacheBound`
to get Rails' actual `schema_cache` semantics.

## Acceptance criteria

- Converge `AbstractAdapter#schemaCache` to return the pool-bound reflection
  handle, matching `abstract_adapter.rb:298` into `connection_pool.rb:285`.
- Move `insertAll` and `validations/uniqueness.ts` onto the converged getter.
- Give the raw memoized cache an internal name if it is still needed, or drop
  it if the bound handle covers every read.
- Delete `schemaCacheBound` and its `@noRailsEquivalent` tag.
- `pnpm parity:api:extra --package activerecord` reports no stale tags.
