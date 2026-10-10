---
title: "Base.loadSchema carries a primary-key warm arm load_schema does not have"
status: claimed
updated: 2026-10-10
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: "2026-10-10T16:39:42Z"
assignee: "base-load-schema-primary-key-warm-arm-moves-to-primary-key-resolution"
blocked-by: null
closed-reason: null
---

## Context

trails#8739 added an arm to `Base.loadSchema` (`packages/activerecord/src/base.ts`, tail of the method): while the schema is loaded and `_primaryKey` is unlatched, it peeks `baseClass.connectionPool().schemaReflection.loadedCache?.getCachedPrimaryKeys?.(table)` and, when cold, awaits `baseClass.schemaCache().primaryKeys(table)`.

Rails' `load_schema` (`vendor/rails/v8.0.2/activerecord/lib/active_record/model_schema.rb:534-546`) has no such arm. The read belongs to `get_primary_key` (`vendor/rails/v8.0.2/activerecord/lib/active_record/attribute_methods/primary_key.rb:101-108`): `ActiveRecord::Base != self && table_exists?` then `schema_cache.primary_keys(table_name)`, latched into `@primary_key` by `reset_primary_key` (`:93-99`) on first read (`:80-81`).

The arm exists because `getPrimaryKey` is synchronous and only peeks the cache, so after `establish_connection` a new pool's cold cache answered `"id"` for a key-less table and `_returning_columns_for_insert` (`model_schema.rb:436-444`) emitted `RETURNING "id"`.

It carries no `@inventedArm` receipt: `base.ts`'s `loadSchema` has no skeleton row, so `pnpm parity:api:arms:throws` reds on any receipt there (`activerecord/base.ts loadSchema: if (declaration not compared)`). The peek is also a fourth open-coded copy of `cachedSchemaCacheFor` (`attribute-methods/primary-key.ts`), which is module-private.

## Converged shape

The primary-key warm lives with the primary-key resolution, not in `load_schema`: the async step that resolves `primary_key` warms the current pool's cache and latches through `resetPrimaryKey`, and `Base.loadSchema` is `load_schema`'s body only. Do this with `latch-primary-key-resolution-into-reset-primary-key-memo`.

## Acceptance criteria

- [ ] `Base.loadSchema` has no primary-key arm and no `getCachedPrimaryKeys` peek.
- [ ] `primary-keys.trails.test.ts` "answers nil and inserts with no RETURNING once the connection is re-established" still passes on all three adapters.
- [ ] No new public name: `pnpm parity:api:extra:gate` stays green.
