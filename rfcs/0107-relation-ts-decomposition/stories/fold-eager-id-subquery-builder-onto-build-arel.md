---
title: "Delete _buildEagerIdSubquery — a second arel-building path Rails does not have"
status: claimed
updated: 2026-08-20
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 260
priority: 11
pr: null
claim: "2026-08-20T10:22:32Z"
assignee: "destroy-async-test-port-and-model-flip"
blocked-by: null
closed-reason: null
---

## Context

`converge-limited-ids-subquery-onto-build-arel-limit-sanitizers` (PR #6733)
routed the eager limited-ids subquery's limit/offset through the same
`sanitizeLimit` / `toI` pair `buildArel` uses
(`vendor/rails/activerecord/lib/active_record/relation/query_methods.rb:1757-1758`).
That closed the injection gap but left the structural cause: trails has TWO
arel-building paths.

`Relation#_buildEagerIdSubquery` (`packages/activerecord/src/relation.ts`,
around the `idSubquery.take` / `.skip` lines) hand-assembles a `SelectManager`
— project, distinct, `buildJoins`, `whereClause.ast`, `buildOrder`, take/skip —
duplicating the first half of `buildArel`
(`relation/query-methods.ts`, `query_methods.rb:1748-1786`). Rails has no such
builder: `construct_relation_for_association_calculations` /
`apply_join_dependency` spawn a RELATION (`reselect(...).distinct!`) and let
`build_arel` build it, which is why Rails' sanitizers, `build_cast_value` wrap
and `build_with` all apply automatically and cannot drift.

The one wrapper still missing on the subquery path is `build_cast_value`
(`:1757-1758`), which the main path applies and this one does not.

## Converged shape

Delete `_buildEagerIdSubquery` and spawn a relation for the id subquery the way
`apply_join_dependency` does, so it reaches `buildArel`. The known limitation
noted in that method's JSDoc (single-column pk only, Rails'
`results.last(pk.length)` + `zip` unhandled) is in the same seam and should be
re-checked once the paths are one.

## Acceptance criteria

- [ ] The eager limited-ids subquery is built by `buildArel`, not by a
      parallel builder; `_buildEagerIdSubquery` is gone.
- [ ] LIMIT/OFFSET on that path carry `build_cast_value` as `:1757-1758` does.
- [ ] Eager-loading suites (`relation/**`, `associations/**`) green on SQLite,
      PostgreSQL and MySQL/MariaDB.
- [ ] `pnpm parity:api:calls` / `:args` green; no new baseline rows.
