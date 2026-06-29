---
title: "Composite-PK distinct_relation_for_primary_key materialization (eager+limit cache_version/pluck)"
status: claimed
updated: 2026-06-29
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: "2026-06-29T14:34:11Z"
assignee: "composite-pk-distinct-relation-materialization"
blocked-by: null
---

## Context

`Relation#computeCacheVersion` (`packages/activerecord/src/relation.ts`), for an
eager-loaded relation with a limit/offset over a collection reflection,
materializes the limited DISTINCT primary keys and rewrites the relation as
`WHERE pk IN (ids)` (Rails' `distinct_relation_for_primary_key`,
`finder_methods.rb:463`). The shared helper `_materializeLimitedIds` and the
`where({ [pk]: ids })` rewrite are **single-column PK only**.

For a composite-PK model this branch currently falls through to the synchronous
`applyJoinDependencyForArel`, which throws `NotImplementedError` (surfacing the
gap rather than emitting a wrong single-column `"col1,col2"` predicate). The
same single-column limitation exists in the `pluck` eager-limit path
(`relation.ts` ~3814), so this is a shared, pre-existing gap — not specific to
cache versioning.

Rails handles composite PKs by materializing `Array(relation.primary_key)` and
rewriting every PK column via `zip(limited_ids.transpose).to_h`
(`finder_methods.rb:463`, `connection_adapters/abstract/schema_statements.rb:1430`
and `:1447`).

Surfaced during review of PR #4162 (collection-cache-key-canonical).

## Acceptance criteria

- [ ] Extend `_materializeLimitedIds` (and the `WHERE pk IN (ids)` rewrite) to
      support composite primary keys, mirroring Rails'
      `Array(primary_key).zip(limited_ids.transpose).to_h`.
- [ ] `computeCacheVersion` and the `pluck` eager-limit path no longer throw
      `NotImplementedError` for composite-PK models; both produce Rails-faithful
      results.
- [ ] Test coverage for a composite-PK model with an eager-loaded
      limit/offset over a collection reflection (cache_version and pluck).
