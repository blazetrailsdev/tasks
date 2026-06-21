---
title: "Delegate _throughOwnerCols derivation to reflection.foreignKey/activeRecordPrimaryKey"
status: ready
updated: 2026-06-20
rfc: "0000-through-association-source-convergence"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`CollectionProxy#_throughOwnerCols`
(`packages/activerecord/src/associations/collection-proxy.ts:1738`) hand-rolls
the through-owner FK / PK derivation: it reimplements the reflection's
`foreign_key` resolution, the `deriveFkQueryConstraints` validation
(2-column-limit, owner-PK-membership errors), and the
`active_record_primary_key` id-collapse logic inline. PR #3698 converged the
scalar base of this derivation to prefer `reflection.foreignKey` (so STI owners
resolve `post_id` not `special_post_id`), but the surrounding composite /
query-constraints machinery is still a parallel copy of what the rich
Reflection already computes.

Rails does not reimplement this in `through_association.rb` — owner attributes
come straight from `through_reflection.foreign_key` and
`through_reflection.active_record_primary_key`
(`vendor/rails/activerecord/lib/active_record/associations/through_association.rb:84`).

## Acceptance criteria

- [ ] Replace the hand-rolled `_throughOwnerCols` derivation with direct
      delegation to the through reflection's `foreignKey` /
      `activeRecordPrimaryKey` (mirroring `through_reflection.foreign_key` and
      `through_reflection.active_record_primary_key`), so the composite /
      query-constraint cases are no longer duplicated inline.
- [ ] No behavior change: composite-PK / query-constraints through associations
      (e.g. Sharded::BlogPost) and the STI scalar case produce identical
      columns to today.
- [ ] Keep `underscore(ctor.name)_id` only as the unregistered-anonymous
      fallback.
