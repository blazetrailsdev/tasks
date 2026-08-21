---
title: "loadSchemaFromAdapter duplicates load_schema!'s body and dispatches the chain over an empty anchor"
status: ready
updated: 2026-08-21
rfc: "0112-one-rails-thing-n-trails-things"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #6799 built the `load_schema!` super chain: `model-schema.ts`'s
`loadSchemaBang` is the anchor (Rails `ModelSchema#load_schema!`,
`vendor/rails/activerecord/lib/active_record/model_schema.rb:587-597`) and the
concern overrides register through `load-schema-overrides-slot.ts`.

It left one seam un-converged. Rails has exactly ONE `load_schema!` body per
module; trails has two, because the async reflection path
`loadSchemaFromAdapter` (`packages/activerecord/src/model-schema.ts`) re-implements
the anchor's work inline — fetch `columns_hash`, `applyColumnsHash`, set
`_schemaLoaded` — and then ends with

```ts
runLoadSchemaChain(this, () => {});
```

i.e. it dispatches the concern overrides over an EMPTY anchor, because the
anchor's body already ran in a different function. `model_schema.rb:534-546`'s
`load_schema` has no such split: `load_schema!` is the only body, and the
cache-vs-adapter distinction lives inside `schema_cache.columns_hash`.

The empty-anchor call is a real deviation, not cosmetic: any future concern
override that relies on `superFn()` having done the reflection sees a no-op on
the async path, and the two bodies drift independently (they already differ —
the sync anchor has a `pkStillMissing` fallback the async one lacks).

## Converged shape

One `load_schema!` body. `loadSchemaFromAdapter` becomes the async fetch that
warms the cache and then calls `loadSchemaBang` (or `loadSchema`), so the chain
runs exactly once over a real anchor and `runLoadSchemaChain`'s second call site
disappears. If the sync/async split has to survive, the shared body must be the
anchor both paths enter, not two copies.

## Acceptance criteria

- [ ] `runLoadSchemaChain` has one call site, inside `loadSchemaBang`.
- [ ] No `runLoadSchemaChain(this, () => {})` empty-anchor dispatch remains.
- [ ] The `pkStillMissing` fallback and the async path agree on one body.
- [ ] `packages/activerecord/src/load-schema-overrides-slot.trails.test.ts` and the
      encryption `load_schema!` column-size test stay green.
