---
title: "composite-pk-eager-pluck-cache-preload-degrade"
status: done
updated: 2026-06-30
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4310
claim: "2026-06-30T04:54:32Z"
assignee: "composite-pk-eager-pluck-cache-preload-degrade"
blocked-by: null
---

## Context

Supersedes `composite-pk-distinct-relation-materialization`, whose premise does
not hold against the current codebase. That story assumed a composite-PK model
with an eager-loaded limit/offset over a collection reflection falls through to
`applyJoinDependencyForArel` and throws `NotImplementedError`, to be fixed by
extending `_materializeLimitedIds` (`distinct_relation_for_primary_key`) for
composite PKs.

Investigation (2026-06-29) shows that branch is **structurally unreachable** for
composite-PK models:

- `JoinDependency#addAssociation`
  (`packages/activerecord/src/associations/join-dependency.ts:263`) bails
  (`return null`) for **any composite source PK**, so a composite-PK model's
  collection association is a documented capability gap and `addAssociationSpec`
  rolls back, leaving `jd.reflections` empty.
- `_eagerReflectionsAreLimitable` therefore sees an empty reflection set and
  reports the relation as **limitable** (`relation.ts` `usingLimitableReflections([]) === true`),
  so `_isDeferredDistinctPkSubquery` returns `false` and neither
  `applyJoinDependencyForArel` nor `_materializeLimitedIds` (only called when
  `jd.nodes.length > 0`) is ever entered. The composite branch of
  `_materializeLimitedIds` would be dead code.

The actual observable failure is a **crash in the eager pluck / cache_version
`leftOuterJoins(eagerSpecs)` call**, not a `NotImplementedError`, and it occurs
**even without a limit/offset**:

```text
CpkBook.includes("chapters").references("chapters").pluck("title")
// → Error: Association named 'chapters' was not found on CpkBook
CpkBook.eagerLoad("chapters").order("author_id","id").limit(2).pluck("title")
// → same crash (relation.ts:3878 `rel.leftOuterJoins(eagerSpecs).pluck(...)`)
CpkBook.eagerLoad("chapters").order("author_id","id").limit(2).cacheVersion("revision")
// → same crash via relation.ts ~6947 `rel.leftOuterJoins(eagerSpecs)`
//   (with collectionCacheVersioning enabled)
```

`toArray` already handles this gracefully: `_executeEagerLoad` checks
`jd.nodes.length === 0` and degrades to **preloading** (relation.ts:3132),
applying limit/offset directly to the base query — no fan-out, no
materialization needed. The `pluck` and `cache_version` (computeCacheVersion)
paths do **not** mirror that fallback; they unconditionally call
`leftOuterJoins(eagerSpecs)` which throws for the unjoinable composite
association.

This is a broader gap than limit/offset: it is the general "unjoinable eager
association in pluck/cache_version" case (composite-key associations, and any
other capability-gap reflection). Rails joins these; trails preloads them, so
the faithful trails behavior is to degrade to preload and read the requested
columns from the base query.

Source: `packages/activerecord/src/relation.ts` (`_pluckInner` ~3847-3878,
`computeCacheVersion` ~6907-6948), `_executeEagerLoad` ~3130-3160 for the
existing graceful pattern; `associations/join-dependency.ts:246-325` for the
composite capability-gap bail.

## Acceptance criteria

- [ ] `pluck` over an eager-loaded relation whose eager association is an
      unjoinable capability gap (composite-PK collection, e.g.
      `CpkBook.eagerLoad("chapters")`) no longer crashes in
      `leftOuterJoins`; it degrades to the preload-equivalent base query
      (mirroring `_executeEagerLoad`'s `jd.nodes.length === 0` fallback),
      preserving any limit/offset and producing Rails-faithful column values.
- [ ] `cache_version` / `computeCacheVersion` over the same relation no longer
      crashes; it computes size/timestamp from the preload-degraded (limit-
      preserved) relation.
- [ ] Behavior holds both with and without a limit/offset (the crash is not
      limit-specific).
- [ ] Test coverage on a composite-PK model (`CpkBook` + `chapters`) for pluck
      and cache_version, with and without limit. Tests live in a
      `*.trails.test.ts` file (no like-named Rails test, since Rails joins
      composite keys rather than preloading).

## Notes

- Do NOT extend `_materializeLimitedIds` for composite PKs — that path is
  unreachable while composite collection joins degrade to preload. If/when
  composite-key JoinDependency joins land (removing the
  `join-dependency.ts:263` bail), revisit distinct_relation_for_primary_key
  materialization as a separate story.
- Keep the change minimal and single-PK-safe: only the `jd.nodes.length === 0`
  (preload-degrade) sub-case should bypass `leftOuterJoins`; joinable single-PK
  eager loads must keep their current join behavior.
