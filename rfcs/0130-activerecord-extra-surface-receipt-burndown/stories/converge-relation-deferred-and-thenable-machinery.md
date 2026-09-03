---
title: "converge-relation-deferred-and-thenable-machinery"
status: draft
updated: 2026-09-03
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Three `relation/` files hold deferred/awaitability machinery with no Rails
counterpart file. After RFC 0130 phase 1 each name carries a
`@noRailsEquivalent CONVERGEABLE` receipt pointing here.

- `relation/thenable.ts` — `applyThenable`, `stripThenable`. Ruby's `Relation`
  is evaluated by any Enumerable call through `records`
  (`relation.rb:293-296`); JS needs an explicit `then` on the prototype, and
  `stripThenable` is the view that hides it again so a `Relation` can be
  returned from an `async` body without being awaited. This is the same
  language shortcoming CLAUDE.md § "Serialization's dual sync/async hash"
  ratifies for `serializable_hash`, but it has never been written down for
  `Relation` — settle it there and make these two receipts `PERMANENT` against
  it, or converge them.
- `relation/predicate-builder/deferred-distinct-pk-in.ts` — 7 names
  (`DeferredDistinctPkIn`, `DeferredDistinctPkNotIn`, `DeferredIdsIn`,
  `DeferredIdsNotIn`, `innerRelation`, `innerRelations`, `literalIds`). Rails
  builds the subselect eagerly in `RelationHandler#call`
  (`relation/predicate_builder/relation_handler.rb:5-25`) because
  `Relation#arel` is synchronous there; trails defers it. Check whether the
  deferral is still needed now that `arel` is reachable synchronously.
- `relation/predicate-builder/is-base-instance.ts` — `isBaseInstance`, the
  duck-typed stand-in for Ruby `value.is_a?(Base)`
  (`relation/predicate_builder.rb:107`). It exists to avoid importing
  `base.ts`; CLAUDE.md § "Call-time constant resolution" gives the sanctioned
  shape for exactly that (`activerecord/src/base-slot.ts` already exports
  `Base`), so this should become a slot read and the file should go.

## Acceptance criteria

- `isBaseInstance` is replaced by an `instanceof` against the `base-slot.ts`
  `Base`, and its file is deleted.
- The deferred-predicate classes are either folded into the eager
  `RelationHandler` shape Rails has, or reduced to the smallest set that a
  ratified section covers.
- `applyThenable` / `stripThenable` end with either a `PERMANENT` receipt
  against a ratified CLAUDE.md section or a converged shape.
- The three files show 0 novel in
  `pnpm parity:api:extra --package activerecord --novel-only`, and the mark is
  tightened.
