---
title: "ar-relation-except-setop-converge"
status: in-progress
updated: 2026-06-24
rfc: "0045-data-layer-api-compare-100"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4052
claim: "2026-06-24T04:30:41Z"
assignee: "ar-relation-except-setop-converge"
blocked-by: null
---

## Context

trails' `Relation#except` carries two meanings overloaded by argument type:

- `except(...skips)` — Rails `SpawnMethods#except(*skips)` value-key remover
  (spawn_methods.rb:59-60), added in PR #4050.
- `except(other: Relation)` — a trails-only SQL `EXCEPT` set operation (paired
  with `union`/`intersect`), with NO Rails equivalent. Pre-existing; tests:
  `packages/activerecord/src/relations.test.ts:748,2831,4687` and
  `relation/arel-ast-convergence.test.ts:106`.

Rails `except` has no set-operation branch — every argument is a skip key. The
overload is a deviation kept only to preserve the pre-existing trails SQL EXCEPT
feature without breaking its tests (out of scope for the Querying delegation
story #4050). `Querying#except` (Base.except) was already made skip-keys-only.

## Acceptance criteria

- Relocate the trails SQL `EXCEPT` set operation off the `except` name (e.g. a
  dedicated method consistent with how `union`/`intersect` are exposed), so
  `Relation#except` matches Rails `SpawnMethods#except` exactly (skip keys only,
  no Relation branch).
- Update the 4 existing SQL-EXCEPT call sites/tests to the new name (test names
  unchanged).
- `api:compare --package activerecord` stays at querying.ts 100% / no relation.ts
  regression; SQL EXCEPT behavior preserved under the new name.
