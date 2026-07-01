---
title: "JoinDependency: join composite-PK model's composite-FK collection association"
status: in-progress
updated: 2026-07-01
rfc: "0027-join-dependency-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 4363
claim: "2026-07-01T04:54:46Z"
assignee: "cpk-join-dependency-composite-fk-collection"
blocked-by: null
---

## Context

`JoinDependency#addAssociation` bails for any composite source PK
(`packages/activerecord/src/associations/join-dependency.ts:263`,
`if (Array.isArray(sourcePk)) return null`), so a composite-PK model's
**collection** association with a composite FK cannot be JOINed. Concretely,
`CpkBook` (`primaryKey = ["author_id", "id"]`) `hasMany("chapters", { foreignKey:
["author_id", "book_id"] })` falls out of the join tree — `jd.nodes` ends up
empty — and trails preloads where Rails joins.

Rails builds the composite FK↔PK tuple ON-clause and JOINs these. This is the
**composite-FK collection** sibling of
`cpk-join-dependency-composite-pk-single-fk` (which targets a composite-PK
source with a _single-column_ FK via `primaryKey` override,
`CpkOrder.joins("orderAgreements")`). Both relax the same
`Array.isArray(sourcePk)` bail but exercise different FK↔PK construction paths;
this one needs the multi-column tuple ON clause for a collection reflection.

Because the join is unsupported, the merged PR #4310 made `pluck` /
`computeCacheVersion` over such eager loads **degrade to preload** (mirroring
`_executeEagerLoad`'s `jd.nodes.length === 0` fallback) instead of crashing in
`leftOuterJoins`. That degrade is a documented deviation, not the faithful end
state: Rails joins. The degrade branches and their deviation tests must be
removed/converged once this join lands.

Source: `associations/join-dependency.ts:246-325` (bail + FK↔PK resolution);
`relation.ts` `_pluckInner` (pluck eager-degrade guard) and `computeCacheVersion`
(eager collection branch); `relation/cpk-eager-pluck-cache-version-degrade.trails.test.ts`
(deviation assertions, incl. the explicit capability-gap error when a pluck
column references the unjoinable table).

## Acceptance criteria

- `CpkBook.eagerLoad("chapters")` (composite-PK source, composite-FK collection)
  builds JOIN nodes via `JoinDependency` (composite FK↔PK tuple ON clause); no
  `return null` bail for this shape.
- `pluck` / `cache_version` over such relations JOIN like Rails rather than
  degrading to preload; the `jd.nodes.length === 0` preload-degrade branches in
  `_pluckInner` and `computeCacheVersion` no longer trigger for composite
  collections.
- `relation/cpk-eager-pluck-cache-version-degrade.trails.test.ts` is converted to
  assert Rails' joining behavior (or removed in favour of a like-named Rails
  test); the "surface explicit error when plucking the unjoinable table's column"
  assertion flips, since the table is now joinable.
- No regression in existing CPK or join-dependency tests.
