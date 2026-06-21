---
title: "Inline polymorphic fallback raises ArgumentError for underivable query_constraints (deriveFkQueryConstraints parity)"
status: in-progress
updated: 2026-06-21
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 3751
claim: "2026-06-20T23:58:57Z"
assignee: "inline-polymorphic-fallback-argumenterror-underivable-query-constraints"
blocked-by: null
---

## Context

PR #3747 (`inline-fallback-polymorphic-as-owner-key-query-constraints`)
introduced `_inlinePolymorphicKeys` (`packages/activerecord/src/associations.ts`)
and routed the inline (no-reflection) polymorphic `loadHasMany`/`loadHasOne`
branches plus `computeHasManyWhere` through it. For a 2-attribute
query_constraints owner it faithfully widens the scalar `${as}_id` FK to the
composite `[shardKey, ${as}_id]`, mirroring
`BelongsToReflection#deriveFkQueryConstraints` (reflection.rb:839-877).

Deviation: `deriveFkQueryConstraints` RAISES `ArgumentError` for the
underivable query_constraints shapes —

- query_constraints list with > 2 attributes,
- the foreign key already present in the constraints list,
- the owner's scalar primary key not present in the constraints list (or a
  composite owner PK).

`_inlinePolymorphicKeys` instead falls through to the scalar collapse
(`Array.isArray(primaryKey) ? "id" : primaryKey`) for all of these, silently
producing a scalar-keyed scope rather than raising. Documented inline as a
deliberate simplification ("rather than reproducing every Rails raise branch")
because the inline fallback is a no-reflection path, but it is a genuine
fidelity gap vs Rails for those configs.

trails refs:

- `_inlinePolymorphicKeys` fallthrough — associations.ts (search `_inlinePolymorphicKeys`)
- reflection-side raises — `deriveFkQueryConstraints`, reflection.ts (~816-861)

## Acceptance criteria

- [x] The inline polymorphic fallback (`_inlinePolymorphicKeys`, used by
      `loadHasMany`/`loadHasOne` and `computeHasManyWhere`) raises
      `ArgumentError` for the same three underivable query_constraints shapes
      that `deriveFkQueryConstraints` raises on, matching Rails messages.
- [x] A no-reflection test with a >2-attribute query_constraints owner
      (`ShardedBlogPostWithRevision`, qc `[blog_id, revision, id]`) and a
      polymorphic `as` association raises `ArgumentError` rather than silently
      scalar-keying.
