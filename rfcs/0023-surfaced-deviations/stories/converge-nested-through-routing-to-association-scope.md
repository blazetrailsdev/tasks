---
title: "Converge nested-through routing onto the JOIN-based AssociationScope (drop isNested bail)"
status: ready
updated: 2026-07-03
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #4492 (hmt-unskip-polymorphic-source) fixed HMT through a polymorphic
source by routing one specific nested-through shape to the JOIN-based
`AssociationScope`. The routing is deliberately gated narrowly via
`_isNestedThroughSourceRoutable` (`packages/activerecord/src/associations.ts`):
it only fires when the _through_ reflection is a plain (non-nested) association
AND only the _source_ reflection is itself a through, AND the owner is
persisted (`!record.isNewRecord()`).

This leaves a Rails deviation: Rails routes **all** nested-through
associations through the JOIN-based `AssociationScope`
(`association_scope.rb` — `reflection.chain` flattens any nesting into a
uniform list of join steps; there is no `isNested()` special-case). trails
instead bails on `reflection.isNested()` in
`_canRouteThroughViaAssociationScope` (associations.ts:759) and keeps these
shapes on the legacy 2-step `loadHasManyThrough` / IN-subquery fallback in
`_buildThroughScope` (collection-proxy.ts):

- nested-through-_through_ (the through reflection is itself a through) — e.g.
  `Pet#persons` through `treasures` where `Pet#treasures` is HMT through
  `petTreasures`. Currently works via the IN-subquery fallback but does not
  share the canonical JOIN path.
- unpersisted-owner nested-through-source — kept on the 2-step loader because
  the SQL JOIN cannot see an in-memory-assigned through target
  (`post.author = mary` before save). Rails resolves these via
  `find_target?` / the loaded through target; trails' 2-step loader mirrors
  that today but the two paths have diverged behavior worth unifying.

## Acceptance criteria

- [ ] Broaden `_canRouteThroughViaAssociationScope` (or a successor) so
      nested-through shapes route through the JOIN-based `AssociationScope`,
      removing the blanket `isNested()` bail, matching Rails' uniform
      `reflection.chain` walk.
- [ ] Retire the narrow `_isNestedThroughSourceRoutable` special-case and the
      IN-subquery fallback in `_buildThroughScope` for the shapes the JOIN path
      now covers.
- [ ] Preserve the in-memory-through (unpersisted owner) semantics — either
      via the JOIN path's own owner-state handling or an explicit fall-back,
      with a test mirroring the Rails behavior.
- [ ] No regressions in `has-many-through-associations.test.ts`,
      `nested-through-associations.test.ts`, `nested-through-preloader.test.ts`,
      or the disable-joins nested suites.

## Notes

Reference Rails: `associations/association_scope.rb` (`add_constraints`,
`next_chain_scope`), `reflection.rb` (`ThroughReflection#chain`,
`#nested?`). trails anchors: `associations.ts:739`
(`_canRouteThroughViaAssociationScope`), `associations.ts:~795`
(`_isNestedThroughSourceRoutable`), `collection-proxy.ts` `_buildThroughScope`.
