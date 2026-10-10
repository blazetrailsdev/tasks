---
title: "activerecord: TableRow#resolve_sti_reflections and the _counter_cache_columns host type read the class_attribute slots at their declared types"
status: draft
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

trails#8762 made every `_reflections` reader read the `class_attribute` slot bare (`vendor/rails/v8.0.2/activerecord/lib/active_record/reflection.rb:11`). Two readers still reach it through a type that disagrees with the slot's declared type (`packages/activerecord/src/base.ts`, `declare static _reflections: Record<string, AssociationReflection>`):

- `packages/activerecord/src/fixture-set/table-row.ts`, `resolveStiReflections` (`vendor/rails/v8.0.2/activerecord/lib/active_record/fixture_set/table_row.rb:148-170`): `Object.values(this.reflectionClass._reflections) as unknown as FixtureReflection[]`. `FixtureReflection` is a file-local interface that requires `joinForeignType`, which only `BelongsToReflection` declares (`reflection.ts`, `get joinForeignType`), so the double cast hides that the `belongs_to` arm reads a member the general reflection type does not have. Rails reads `association.join_foreign_type` inside `when :belongs_to` only (`table_row.rb:152-164`).
- `packages/activerecord/src/persistence.ts`, the instance host type that declares `_counterCacheColumns?: string[]` as optional. `_counter_cache_columns` is `class_attribute ..., default: []` (`vendor/rails/v8.0.2/activerecord/lib/active_record/counter_cache.rb:9`) and is never absent.

## Acceptance criteria

- [ ] `resolveStiReflections` iterates `_reflections` with no `as unknown as` cast; the `belongsTo` arm narrows to the reflection type that declares `joinForeignType`, and the file-local `FixtureReflection` interface is deleted or reduced to what `ReflectionProxy` / `HasManyThroughProxy` need.
- [ ] The `persistence.ts` host type declares `_counterCacheColumns: string[]`, and any reader guarding for its absence drops the guard.
- [ ] `pnpm typecheck`, `pnpm parity:api:calls` and `pnpm parity:api:calls:args` stay green.

## Verification

```bash
pnpm vitest run packages/activerecord/src/fixtures.test.ts packages/activerecord/src/fixtures.trails.test.ts packages/activerecord/src/counter-cache.test.ts
```
