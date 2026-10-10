---
title: "Base.loadSchema memoizes a warm that loaded nothing, so a later table or connection never loads columns"
status: ready
updated: 2026-10-10
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
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

`Base.loadSchema` (`packages/activerecord/src/base.ts`) memoizes its warm in `_schemaLoadPromise`, cleared only by `reloadSchemaFromCache` (`model-schema.ts`) or a rejection. `loadSchemaFromAdapter` (`model-schema.ts`) RESOLVES without loading when the table is absent (`exists === false`), when the model has no pool, or when the adapter changed mid-warm.

So a model whose first `loadSchema` ran before its table existed (or before a connection was established) keeps a resolved promise, and every later `ensureSchemaLoaded` (`persistence.ts`, `relation.ts`, `transactions.ts`, `core.ts`) is a no-op: the columns never load, even after `establish_connection` to a database that has the table.

Rails memoizes only success: `load_schema` (`vendor/rails/v8.0.2/activerecord/lib/active_record/model_schema.rb:534-546`) returns early on `schema_loaded?` and sets `@schema_loaded = true` only after `load_schema!` ran; a failed or absent load is retried on the next read, against the current pool's `schema_cache` (`:587-597`).

Found while fixing trails#8739 (first attempt keyed the memo per pool and was rejected in review as an invented memo key; the stale no-op memo itself was left).

## Converged shape

The warm promise is reused only while it is in flight or once `_schemaLoaded` is own-true; a warm that resolved without loading is not memoized, as `schema_loaded?` is Rails' only guard.

## Acceptance criteria

- [ ] A model that calls `loadSchema()` before its table exists, then again after the table is created (or after `establishConnection` to a database that has it), has its columns loaded by the second call. Test fails on trails main at the merge of #8739.
- [ ] Concurrent `loadSchema()` calls still share one in-flight warm.
- [ ] No second memo field keyed on the pool.
