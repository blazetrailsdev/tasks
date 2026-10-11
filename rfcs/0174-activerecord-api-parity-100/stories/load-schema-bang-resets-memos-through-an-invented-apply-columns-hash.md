---
title: "activerecord: load_schema! resets ten memos through an invented applyColumnsHash; Rails resets only in reload_schema_from_cache"
status: draft
updated: 2026-10-11
rfc: "0174-activerecord-api-parity-100"
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

Surfaced in trails#8776.

Rails' `load_schema!`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/model_schema.rb:587-597`) is four statements: the
`table_name` raise, `columns_hash = schema_cache.columns_hash(table_name)`, the `ignored_columns`
`except`, `@columns_hash = columns_hash.freeze`, then `_default_attributes`. It clears no memo. Every
memo reset lives in `reload_schema_from_cache` (`model_schema.rb:553-572`).

trails' `loadSchemaBang` (`packages/activerecord/src/model-schema.ts`) hands the peeked columns to a
module-private `applyColumnsHash`, which has no Rails counterpart. It filters ignored columns with a
hand-written loop, and then resets ten memos through a local `CacheBag` type: `_attributesBuilder`,
`_yamlEncoder`, `_cachedDefaultAttributes`, `_cachedAttributeTypes`, `_columns`, `_columnNames`,
`_contentColumns`, `_columnDefaults`, `_symbolColumnToStringNameHash` and `_attributeNames`. It also
sets `_attributeMethodsGenerated = false`. The stored hash is not frozen.

The resets exist because a synchronous reader on a cold schema cache memoizes off the fallback
(`columnNames`, `columnDefaults`), and the later async warm (`loadSchemaFromAdapter`) enters
`loadSchemaBang` without passing through `reloadSchemaFromCache`. Two tests in
`packages/activerecord/src/model-schema.trails.test.ts` pin that: "a warm-cache load invalidates a
columnNames memo taken off the synthesized fallback" and the `columnDefaults` twin added by
trails#8776. trails#8776 had to add `_columnDefaults` to the bag by hand, which is the cost of keeping
a second reset list.

## Converged shape

`loadSchemaBang` is `model_schema.rb:587-597`: `except` for the ignored columns, a frozen
`_columnsHash`, `_defaultAttributes()`. `applyColumnsHash` and its `CacheBag` are deleted. A memo taken
off a cold cache is invalidated by `reloadSchemaFromCache`, called from the warm step before it enters
`loadSchemaBang`, so there is one reset list and it is Rails'.

## Acceptance criteria

- [ ] `applyColumnsHash` is deleted and `loadSchemaBang` mirrors `model_schema.rb:587-597` line for line.
- [ ] `_columnsHash` is frozen, as `@columns_hash = columns_hash.freeze`.
- [ ] The two cold-then-warm tests in `model-schema.trails.test.ts` still pass.
- [ ] `pnpm parity:api:calls` stays green with any now-stale baseline row deleted.
