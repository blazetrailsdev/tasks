---
title: "resolve-model-schema-reflection-adapter-fallback"
status: ready
updated: 2026-07-27
rfc: "0073-permanent-connection-checkout-disallowed"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: 35
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

After #5323 fixed `core.ts` `cachedFindBy` and `InsertAll.execute`,
`packages/activerecord/src/model-schema.ts:41` is the **only remaining
production-code site** that reaches the `permanentConnectionCheckout` gate — 11
hits in the 2026-07-25 measurement against `main`.

```ts
function reflectionAdapter(klass: any): any {
  return threadedConnectionFor(klass) ?? klass.connection;
}
```

Its JSDoc states the fallback is deliberate: `threadedConnectionFor` never
throws (returns `null`), so the `.connection` fallback is what preserves
throw-behavior for callers that rely on `try`/`catch`. That rationale is real
and must be engaged with, not mechanically rewritten away.

Rails has no equivalent fallback — `model_schema.rb:381/406/412` uses
`with_connection { |c| ... }` throughout and never reads the getter.

Related: `primary_key` resolution must read the schema cache via
pool/`activeConnection` (or `pool.poolConfig.schemaCache`, whose
`getCachedPrimaryKeys` is sync), NOT `this.connection` — model construction
reads `primary_key` and would otherwise lease permanently. Mirrors Rails'
`get_primary_key` → `schema_cache.primary_keys`.

## Acceptance criteria

- A decision, recorded in the PR body: either the fallback is converged onto the
  pool/`withPooledOrDirectConnection` shape, or it is documented as a deliberate
  permanent divergence with the try/catch callers named explicitly.
- If converged: identify which callers depend on the throw and confirm each
  still gets one (or is adapted).
- Hits from `model-schema.ts:41` drop to 0, or the site is added to a documented
  exception list that story D's flip honors.
- **Run PG and MySQL lanes in CI** — see the RFC's constraint 1.

## Caution

`withConnection` is the wrong helper for this call site — it raises
`ConnectionNotDefined` for `Model.adapter = x` models. Use
`withPooledOrDirectConnection`. Invisible on SQLite.
