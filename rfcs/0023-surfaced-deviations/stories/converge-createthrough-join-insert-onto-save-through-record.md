---
title: "converge _createThrough's join-row insert onto saveThroughRecord"
status: draft
updated: 2026-07-24
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while fixing PR #5192 (`save-through-record-uses-bang-save`).

Rails has exactly one path that persists a has_many_through join row:
`build_through_record` + `save_through_record`
(`vendor/rails/activerecord/lib/active_record/associations/has_many_through_association.rb:58-88`).
Every `<<` / `concat` / `create` form funnels into it via `insert_record`.

trails has **two**. Besides
`saveThroughRecord`/`buildThroughRecord`
(`packages/activerecord/src/associations/has-many-through-association.ts:574`,
`:440`), `CollectionProxy._createThrough`'s `insertJoinRecord` closure
(`packages/activerecord/src/associations/collection-proxy.ts:2400-2460`)
re-derives the join attributes itself — through-scope attrs, owner join attrs,
source join attrs, polymorphic `_type` column — and inserts with
`throughModel.createBang(joinAttrs)`. It has no counterpart in Rails.

The two paths already drifted once and were patched independently:

- `collection-proxy.ts:2446` carries a hand-rolled "skip insert if the through
  record was already persisted" guard that reaches into
  `_throughRecordsCaches` — a re-implementation of the cache that
  `build_through_record`/`save_through_record` own.
- The `createBang` choice at `:2454` is justified in a comment as matching
  `save_through_record`'s `save!` — i.e. it is manually kept in sync with the
  behavior #5192 just fixed on the other path. Nothing enforces that.

Polymorphic-type resolution, `sourceType` handling, and the
`throughScopeAttributes` except-list are all duplicated between the two, so a
fidelity fix to one silently leaves the other behind.

## Acceptance criteria

- [ ] `CollectionProxy._createThrough` persists its join row through
      `buildThroughRecord` + `saveThroughRecord` rather than re-deriving
      `joinAttrs` and calling `throughModel.createBang`, so there is a single
      join-row path as in Rails.
- [ ] The bespoke `_throughRecordsCaches` persisted-check at
      `collection-proxy.ts:2446` is dropped in favor of the cache handling
      already inside `buildThroughRecord`/`saveThroughRecord`.
- [ ] Polymorphic through (`options.as` / `foreignType`) and `sourceType`
      continue to resolve identically — the scope-rewritten type
      (e.g. TaggedPost's `taggings` `rewhere(taggable_type:)`) must still win
      over the owner's `polymorphicName`.
- [ ] No regression in has_many_through / HABTM / nested-through /
      polymorphic-sti-through suites; the spurious empty DEFAULT-VALUES INSERT
      described at `collection-proxy.ts:2454` must not return.

If convergence proves infeasible, document the blocking reason at the call site
per the deviation-justification convention rather than closing won't-do.
