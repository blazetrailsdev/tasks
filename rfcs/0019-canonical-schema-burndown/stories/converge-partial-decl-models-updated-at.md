---
title: "Converge partial-declaration models that mask updated_at (cache-key/integration/associations/named-scoping)"
status: in-progress
updated: 2026-06-17
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: []
deps-rfc: []
est-loc: 500
priority: 1
pr: 3569
claim: "2026-06-17T20:26:29Z"
assignee: "converge-partial-decl-models-updated-at"
blocked-by: null
---

## Context

Blocks RFC 0030 story `virtual-reconcile-warm-schema-cache`. That story warms the
shared schema cache when `reconcileVirtualAttributes(reflect: true)` reflects on a
cold cache (route through `schemaCache.columnsHash` instead of raw
`connection.columns`, `model-schema.ts` reflectColumnNames ~1125). Warming the
shared cache makes `columnsHash()`/`columnNames()` return the table's **real**
columns for models that declared only a subset via `attribute()` — which is
Rails-faithful (`column_names` is always `columns.map(&:name)`), but breaks
several bespoke test files that fake a partial schema to hide `updated_at`.

Concretely, `cacheKey()` (`integration.ts:108-130`) with `cache_versioning = false`
(the Rails default — `vendor/rails/activerecord/lib/active_record/integration.rb:24`,
matched by `base.ts:746`) returns `model/id-<timestamp>` whenever the table has an
`updated_at` column. The canonical `users`/`developers`/etc. tables DO have
`updated_at` (`test-helpers/test-schema.ts:1591` users), so a Rails `User` yields
`users/1-<ts>`. The trails tests get the deviating `users/1` only because the
model declares just `id`/`name` via `attribute()`, masking `updated_at`.

Affected, failing once the cache is warmed (verified on PR #3560):

- `cache-key.test.ts:349` (grandfathered) — `User` declares id/name only → expects `users/1`.
- `integration.test.ts:284,298,327,354,404` — `Developer` cacheKey/cacheVersion timestamp asserts.
- `associations.test.ts:931,978` (grandfathered; partial 0019 via PR #3465) — remaining bespoke describes.
- `scoping/named-scoping.test.ts:863` (grandfathered).

## Acceptance criteria

- [ ] Open the corresponding Rails test FIRST for each file
      (`vendor/rails/activerecord/test/cases/...`) and port bodies/assertions
      word-for-word; test names unchanged (`test:compare` matches on names).
- [ ] Replace the partial-declaration bespoke models with canonical models +
      `useHandlerFixtures` on the real tables, so each model carries the table's
      full column set (incl. `created_at`/`updated_at`).
- [ ] Update expectations to the Rails-faithful values: where `cache_versioning`
      is off and the table has `updated_at`, `cacheKey()` is `model/id-<ts>`, NOT
      `model/id`. Never ratify the partial-schema `model/id` deviation.
- [ ] Remove each grandfathered file from
      `eslint/require-canonical-schema-exclude.json` in the final converting PR
      (cache-key, associations, named-scoping). `integration.test.ts` is not
      listed — just converge it.
- [ ] Per-file PRs off `main`, non-overlapping, each ≤500 LOC; do NOT fan out
      sibling PRs from one agent. Register remaining waves with `pnpm tasks new`.
- [ ] After these land, `virtual-reconcile-warm-schema-cache` warming can land
      green (re-run its 2 tests + the four files above).

## Definition of done

The four files use canonical models/fixtures with Rails-faithful cacheKey/column
expectations, grandfathered entries removed, and the warming change from
`virtual-reconcile-warm-schema-cache` passes against them. Swapping schema while
leaving bodies diverging from Rails is NOT done.
