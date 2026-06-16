---
title: "loadHasMany/loadHasOne no-reflection fallback: resolve composite query_constraints owner key"
status: ready
updated: 2026-06-16
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: 50
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Follow-up surfaced while merging PR #3478
(`assoc-append-cfk-query-constraints-update-convergence`, RFC 0019).

PR #3478 fixed composite-FK owner-key resolution for query_constraints owners
(e.g. `Sharded::BlogPost` qc `[blog_id, id]`, has_many `comments` FK
`[blog_id, blog_post_id]`) in `computeHasManyWhere` and the CollectionProxy
append path by delegating to `reflection.activeRecordPrimaryKey` (the shared
resolver, Rails `reflection.rb:587 active_record_primary_key`).

The reflection-routed query paths (`loadHasMany`/`loadHasOne` →
AssociationScope, preload/eager-load) are already correct because they build
the join via `joinForeignKey` → `activeRecordPrimaryKey`.

However, the **inline no-reflection fallback** branches in `loadHasMany`
(`packages/activerecord/src/associations.ts:1383-1392`) and `loadHasOne`
(~`:1148-1175`) still resolve the owner key as
`options.primaryKey ?? ctor.primaryKey`. For a composite-FK query_constraints
owner with a scalar primary key, `pkCols=[primaryKey]` (length 1) is zipped
against a length-2 `foreignKey`, so the branch throws
`CompositePrimaryKeyMismatchError` instead of keying on `[blog_id, id]`.

This path only fires when the reflection is NOT registered (lower-level test
helpers that define associations via the raw API without
`Reflection.create`), so it does not affect canonical-model usage — but it is
an inconsistency with the two sites PR #3478 just converged.

## Acceptance criteria

- [ ] `loadHasMany` and `loadHasOne` inline (no-reflection) fallback branches
      derive the composite owner key from the owner's query_constraints
      (matching `reflection.activeRecordPrimaryKey` semantics) when the FK is
      composite and the owner PK is scalar, consistent with
      `computeHasManyWhere`.
- [ ] A test exercising the lower-level (no-reflection) API with a
      query_constraints owner + composite FK loads/keys correctly rather than
      raising `CompositePrimaryKeyMismatchError`.
