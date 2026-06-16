---
title: "Auto-detect query-time STI type condition from inheritance-column presence (drop enableSti opt-in)"
status: in-progress
updated: 2026-06-16
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 3441
claim: "2026-06-16T02:50:11Z"
assignee: "converge-query-sti-type-condition-auto-detect"
blocked-by: null
---

## Context

Surfaced by RFC 0030 story b2-sti-type-survives-unscope (PR #3419). The
query-time STI type-condition gate diverges from Rails.

trails: `_applyStiTypeCondition` (base.ts:1719-1727) gates on `isStiSubclass`,
which is true only when an ancestor has an explicitly-set `_inheritanceColumn`
(i.e. `enableSti` was called). The test-helpers `Post` model never called
`enableSti`, so `ConditionalStiPost.all()` / `SubConditionalStiPost.all()`
emitted no `type IN (...)` predicate at all. PR #3419 worked around this by
adding `enableSti(Post)` in the fixture model.

Rails: STI is auto-derived, no opt-in. `finder_needs_type_condition?` =
`!descends_from_active_record? && _has_attribute?(inheritance_column)`
(inheritance.rb). `descends_from_active_record?` is purely hierarchical and the
condition is keyed off `columns_hash.include?(inheritance_column)` — any
non-base model whose table carries a `type` column gets the type condition,
with opt-out via `self.inheritance_column = nil`/`:disabled`.

The explicit-enable design is deliberate (see `stiEnabled` doc in
inheritance.ts): DB-row dispatch paths resolve through the ambiguous global
model registry and were intentionally scoped to explicitly-modeled hierarchies.
Converging the _query-side_ gate to Rails column-presence detection must not
reintroduce that registry ambiguity — likely scope the auto-detection to the
relation/type-condition path while leaving row-path dispatch gating intact.

Related (done): [[infer-sti-at-instantiate-from-reflected-column]],
[[inheritance-column-default-type-and-has-attribute-gate]].

## Acceptance criteria

- [ ] `_applyStiTypeCondition` / `isStiSubclass` derive STI participation from
      inheritance-column presence + class hierarchy (Rails
      `finder_needs_type_condition?`), not from an explicit `enableSti` sentinel.
- [ ] Models with a `type` column and a non-abstract base auto-layer
      `type IN (...)` on `.all()`/associations without calling `enableSti`.
- [ ] Opt-out via `inheritanceColumn = "disabled"`/nil still suppresses it.
- [ ] Remove the workaround `enableSti(Post)` in test-helpers/models/post.ts.
- [ ] Full AR suite green across sqlite/mariadb/postgres (blast radius is
      suite-wide — every model with a `type` column is affected).
